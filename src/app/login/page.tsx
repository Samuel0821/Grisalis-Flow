
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { createAuditLog, getAllUsers, UserProfile } from '@/lib/firebase/firestore';
import { doc, setDoc, serverTimestamp, getFirestore, writeBatch } from 'firebase/firestore';


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSetupNeeded, setIsSetupNeeded] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    // Check if any user exists to determine if the setup button should be shown
    const checkUsers = async () => {
      try {
        const users = await getAllUsers();
        setIsSetupNeeded(users.length === 0);
      } catch (error) {
        // This might fail if rules prevent listing users, which is fine.
        // We'll assume setup is not needed if we can't check.
        console.warn("Could not check for existing users, assuming setup is complete.", error);
        setIsSetupNeeded(false);
      } finally {
        setIsCheckingSetup(false);
      }
    };
    checkUsers();
  }, []);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
      const user = userCredential.user;

      await createAuditLog({
        userId: user.uid,
        userName: user.displayName || email,
        action: 'User signed in successfully',
        entity: 'user',
        entityId: user.uid,
        details: { email },
      });

      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente.',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      
      // We don't have a user ID on failed login, so we log what we can.
      await createAuditLog({
        userId: 'anonymous',
        userName: email,
        action: 'User failed to sign in',
        entity: 'user',
        entityId: 'unknown',
        details: { email, error: (error as Error).message },
      });
      
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: 'Las credenciales son incorrectas. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupFirstAdmin = async () => {
    setIsSeeding(true);
    const adminEmail = 'admin@grisalistech.com';
    const adminPassword = 'Adm1nTech1411';
    const db = getFirestore();
    const auth = getAuth();

    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const user = userCredential.user;

        // 2. Use a batch write for atomic operation
        const batch = writeBatch(db);

        // 3. Create user profile in Firestore
        const userProfileRef = doc(db, 'userProfiles', user.uid);
        const userProfileData: Omit<UserProfile, 'id'> = {
            email: user.email!,
            displayName: 'Admin Grisalis',
            role: 'admin',
            createdAt: serverTimestamp() as any,
        };
        batch.set(userProfileRef, userProfileData);

        // 4. Create initial audit log
        const auditLogRef = doc(collection(db, 'auditLogs'));
        const auditLogData = {
             userId: user.uid,
             userName: 'Admin Grisalis',
             action: 'Initial admin user created',
             entity: 'user',
             entityId: user.uid,
             details: { email: user.email },
             timestamp: serverTimestamp()
        };
        batch.set(auditLogRef, auditLogData);

        // 5. Commit the batch
        await batch.commit();

        toast({
            title: '¡Administrador Creado!',
            description: 'Tu usuario administrador ha sido configurado. Ahora puedes iniciar sesión.',
        });
        setIsSetupNeeded(false); // Hide the setup button

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({
                variant: 'default',
                title: 'Administrador ya existe',
                description: 'El usuario administrador ya fue creado. Por favor, inicia sesión.',
            });
            setIsSetupNeeded(false);
        } else {
            console.error('Error creating first admin:', error);
            toast({
                variant: 'destructive',
                title: 'Error en la Configuración',
                description: `No se pudo crear el usuario administrador. Error: ${error.message}`,
            });
        }
    } finally {
        setIsSeeding(false);
    }
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mb-4 flex justify-center">
              <Logo className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold tracking-tight">
              Grisalis Flow
            </CardTitle>
            <CardDescription>
              ¡Bienvenido de nuevo! Por favor, inicia sesión para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSetupNeeded && !isCheckingSetup && (
               <Card className="mb-6 bg-yellow-50 border-yellow-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-900 text-lg">
                        <AlertTriangle className="h-5 w-5" />
                        Configuración Requerida
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-yellow-800 mb-4">
                        Parece que es la primera vez que ejecutas la aplicación. Debes crear el primer usuario administrador para poder ingresar.
                    </p>
                    <Button 
                        className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                        onClick={handleSetupFirstAdmin}
                        disabled={isSeeding}
                    >
                         {isSeeding ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando Administrador...
                            </>
                         ) : (
                             <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Crear Usuario Admin
                             </>
                         )}
                    </Button>
                </CardContent>
               </Card>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isSeeding}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isSeeding}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isSeeding || isSetupNeeded}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              Contacta al administrador para obtener una cuenta.
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
