
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
import { Loader2, AlertTriangle, Users } from 'lucide-react';
import { createAuditLog } from '@/lib/firebase/firestore';
import { doc, setDoc, serverTimestamp, getFirestore, writeBatch, collection, getDocs, query, limit } from 'firebase/firestore';


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
        const db = getFirestore();
        try {
            const usersRef = collection(db, 'userProfiles');
            const q = query(usersRef, limit(1));
            const usersSnapshot = await getDocs(q);
            setIsSetupNeeded(usersSnapshot.empty);
        } catch (error) {
            console.error("Error checking for users:", error);
            // Assume setup is needed if we can't check
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

  const handleSetupTeam = async () => {
    setIsSeeding(true);
    const db = getFirestore();
    const auth = getAuth();

    const team = [
        { name: 'Samuel Grisales', email: 'samuel.grisales@grisalistech.com', role: 'admin' },
        { name: 'Marco Arce', email: 'marco.arce@grisalistech.com', role: 'member' },
        { name: 'Kevin Alfonso', email: 'kevin.alfonso@grisalistech.com', role: 'member' },
        { name: 'Samuel Morales', email: 'samuel.morales@grisalistech.com', role: 'member' },
        { name: 'Juan Ordoñez', email: 'juan.ordonez@grisalistech.com', role: 'member' },
    ];
    const defaultPassword = 'GrisalisFlow2024!';

    try {
        const batch = writeBatch(db);

        for (const member of team) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, member.email, defaultPassword);
                const user = userCredential.user;

                const userProfileRef = doc(db, 'userProfiles', user.uid);
                const userProfileData = {
                    id: user.uid,
                    email: user.email!,
                    displayName: member.name,
                    role: member.role,
                    createdAt: serverTimestamp(),
                };
                batch.set(userProfileRef, userProfileData);

            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                   console.log(`Usuario ${member.email} ya existe, omitiendo creación.`);
                   continue;
                }
                throw error;
            }
        }
        
        const auditLogRef = doc(collection(db, 'auditLogs'));
        batch.set(auditLogRef, {
             userId: 'system',
             userName: 'Sistema',
             action: 'Configuración inicial del equipo completada',
             entity: 'user',
             entityId: 'system',
             details: { teamSize: team.length },
             timestamp: serverTimestamp()
        });

        await batch.commit();

        toast({
            title: '¡Equipo Configurado!',
            description: 'Todos los usuarios del equipo han sido creados. Ahora pueden iniciar sesión.',
        });
        setIsSetupNeeded(false);

    } catch (error: any) {
        console.error('Error configurando el equipo:', error);
        toast({
            variant: 'destructive',
            title: 'Error en la Configuración',
            description: `No se pudo crear el equipo. Error: ${error.message}`,
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
                        Parece que es la primera vez que ejecutas la aplicación. Debes crear el equipo inicial para poder ingresar.
                    </p>
                    <Button 
                        className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                        onClick={handleSetupTeam}
                        disabled={isSeeding}
                    >
                         {isSeeding ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Configurando Equipo...
                            </>
                         ) : (
                             <>
                                <Users className="mr-2 h-4 w-4" />
                                Configurar Equipo Inicial
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
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              La contraseña por defecto para el equipo es: <span className="font-bold">GrisalisFlow2024!</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
