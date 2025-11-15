
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
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { createAuditLog } from '@/lib/firebase/firestore';
import { collection, getDocs, getFirestore, limit, query } from 'firebase/firestore';
import { createUserWithEmailAndPassword as createAuthUser } from '@/lib/firebase/auth';


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
    const checkUsers = async () => {
        setIsCheckingSetup(true);
        const db = getFirestore();
        try {
            const usersRef = collection(db, 'userProfiles');
            const q = query(usersRef, limit(1));
            const usersSnapshot = await getDocs(q);
            setIsSetupNeeded(usersSnapshot.empty);
        } catch (error) {
            console.error("Error checking for users:", error);
            setIsSetupNeeded(true);
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
        action: 'Usuario ha iniciado sesión correctamente',
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
      
      await createAuditLog({
        userId: 'anonymous',
        userName: email,
        action: 'Usuario falló al iniciar sesión',
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

  const handleSetupAdmin = async () => {
    setIsSeeding(true);

    const admin = { name: 'Samuel Grisales', email: 'samuel.grisales@grisalistech.com', role: 'admin' as const };
    const defaultPassword = 'GrisalisFlow2024!';

    try {
        const userCredential = await createAuthUser(admin.email, defaultPassword, admin.name, admin.role);
        
        await createAuditLog({
             userId: userCredential.user.uid,
             userName: 'Sistema',
             action: 'Creación de la cuenta de administrador principal',
             entity: 'user',
             entityId: userCredential.user.uid,
             details: { email: admin.email }
        });

        toast({
            title: '¡Administrador Creado!',
            description: 'La cuenta de administrador principal ha sido creada. Ahora puedes iniciar sesión.',
        });
        setIsSetupNeeded(false);

    } catch (error: any) {
        console.error('Error configurando el administrador:', error);
        let description = `No se pudo crear el administrador. Error: ${error.message}`;
        if (error.code === 'auth/email-already-in-use') {
            description = 'La cuenta de administrador ya existe. Por favor, inicia sesión.';
            setIsSetupNeeded(false);
        }
        toast({
            variant: 'destructive',
            title: 'Error en la Configuración',
            description,
        });
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
            {isCheckingSetup ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : isSetupNeeded ? (
               <Card className="mb-6 bg-yellow-50 border-yellow-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-900 text-lg">
                        <AlertTriangle className="h-5 w-5" />
                        Configuración Requerida
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-yellow-800 mb-4">
                        Parece que es la primera vez que ejecutas la aplicación. Debes crear la cuenta de administrador principal para poder ingresar.
                    </p>
                    <Button 
                        className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                        onClick={handleSetupAdmin}
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
                                Crear Administrador Principal
                             </>
                         )}
                    </Button>
                </CardContent>
               </Card>
            ) : null}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.email@grisalistech.com"
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
              <Button type="submit" className="w-full" disabled={isLoading || isSeeding || (isSetupNeeded && !isSeeding)}>
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
           <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              Si aún no tienen asignado un usuario, comunícate con el administrador
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
