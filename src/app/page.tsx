
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, UserCheck, ShieldCheck, Zap, Droplets, HardHat, Hammer, Star, Search, UserPlus } from 'lucide-react';
import { MaestroYaLogo } from '@/components/logo';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DemoRequestForm } from '@/components/landing/demo-request-form';
import { useInView } from 'react-intersection-observer';
import { CountUp } from '@/components/ui/count-up';

const services = [
  {
    icon: <Droplets className="h-8 w-8 text-primary" />,
    title: 'Plomería',
    description: 'Soluciones expertas para fugas, atascos, instalaciones y mantenimiento de tuberías.',
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Electricidad',
    description: 'Reparación de cortocircuitos, instalación de luminarias, y revisión de tableros eléctricos.',
  },
  {
    icon: <Hammer className="h-8 w-8 text-primary" />,
    title: 'Carpintería',
    description: 'Muebles a medida, reparaciones de puertas y ventanas, y acabados en madera para tu hogar.',
  },
  {
    icon: <HardHat className="h-8 w-8 text-primary" />,
    title: 'Albañilería',
    description: 'Remodelaciones, reparaciones de paredes, y acabados de construcción con calidad garantizada.',
  },
];

const whyChooseUs = [
  {
    icon: <ShieldCheck className="h-8 w-8 text-white" />,
    title: 'Garantía Total sobre el Trabajo',
    description: 'Si el trabajo no queda perfecto, volvemos sin costo alguno. Tu satisfacción no es una opción, es nuestra promesa.'
  },
  {
    icon: <UserCheck className="h-8 w-8 text-white" />,
    title: 'Técnicos de Máxima Confianza',
    description: 'La seguridad de tu hogar es primordial. Cada técnico supera un estricto proceso de selección que incluye la verificación de antecedentes y referencias, garantizando que solo recibas a profesionales de total confianza.'
  },
  {
    icon: <Zap className="h-8 w-8 text-white" />,
    title: 'Respuesta Rápida y Eficaz',
    description: 'Entendemos tu urgencia. Coordinamos la visita técnica de forma ágil para resolver tu problema en el menor tiempo posible.'
  },
];


const StatsSection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <section ref={ref} className="py-12 md:py-20 bg-muted/50">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center">
            <p className="text-4xl font-extrabold text-primary" >
              {inView ? <CountUp end={500} /> : '0'}+
            </p>
            <p className="text-muted-foreground mt-2">Maestros Verificados</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-4xl font-extrabold text-primary">
              {inView ? <CountUp end={1500} /> : '0'}+
            </p>
            <p className="text-muted-foreground mt-2">Trabajos Completados</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-4xl font-extrabold text-primary">
              {inView ? <CountUp end={98} /> : '0'}%
            </p>
            <p className="text-muted-foreground mt-2">Clientes Satisfechos</p>
          </div>
          <div className="flex flex-col items-center">
             <p className="text-4xl font-extrabold text-primary">
              {inView ? <CountUp end={24} /> : '0'}h
            </p>
            <p className="text-muted-foreground mt-2">Respuesta Promedio</p>
          </div>
        </div>
      </div>
    </section>
  );
};


export default function LandingPage() {
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MaestroYaLogo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">MaestroYa</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
             <Link href="#servicios" className="text-muted-foreground transition-colors hover:text-foreground">Servicios</Link>
             <Link href="#como-funciona" className="text-muted-foreground transition-colors hover:text-foreground">¿Cómo Funciona?</Link>
             <Link href="#confianza" className="text-muted-foreground transition-colors hover:text-foreground">Confianza</Link>
          </nav>
          <div className="flex items-center gap-2">
             <Button variant="ghost" asChild>
                <Link href="/login">Acceder</Link>
            </Button>
             <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  Solicitar Servicio <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Solicita tu Servicio</DialogTitle>
                  <DialogDescription>
                    Completa tus datos y describe tu problema. Nos pondremos en contacto a la brevedad.
                  </DialogDescription>
                </DialogHeader>
                <DemoRequestForm onSuccess={() => setIsServiceDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative pt-24 pb-12 md:pt-32 md:pb-20">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-20"></div>
           <div className="container">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="text-center md:text-left">
                     <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter mb-6 leading-tight">
                        ¿Una avería en casa? <br/>
                        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">La solución experta, a un clic.</span>
                    </h1>
                    <p className="mt-6 max-w-xl mx-auto md:mx-0 text-lg text-muted-foreground">
                        Una fuga, un fallo eléctrico, una reparación que no puede esperar... La incertidumbre de no saber a quién llamar se terminó. Te conectamos con maestros de confianza en Quito para resolverlo de forma rápida, segura y con garantía.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="lg">
                            <Search className="mr-2 h-5 w-5"/>
                            Encontrar un Maestro
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                              <DialogTitle>Encuentra tu Solución</DialogTitle>
                              <DialogDescription>
                                Completa tus datos y un técnico experto se pondrá en contacto.
                              </DialogDescription>
                            </DialogHeader>
                            <DemoRequestForm onSuccess={() => setIsServiceDialogOpen(false)} />
                        </DialogContent>
                      </Dialog>
                      <Button size="lg" variant="outline" asChild>
                        <Link href="/login">
                          <UserPlus className="mr-2 h-5 w-5"/>
                          Soy Maestro Profesional
                        </Link>
                      </Button>
                    </div>
                    <div className="mt-8 flex gap-6 justify-center md:justify-start text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-green-500" /> Profesionales Verificados</div>
                      <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Trabajos 100% Garantizados</div>
                    </div>
                  </div>
                  <div className="relative hidden md:block">
                     <Image
                        src="https://storage.googleapis.com/firebase-studio-storage/maestro-ya-public/hero-maestro-cliente-v2.png"
                        alt="Maestro técnico profesional mostrando el trabajo terminado a un cliente satisfecho"
                        width={600}
                        height={600}
                        className="rounded-xl shadow-2xl"
                      />
                      <Card className="absolute -bottom-8 -left-12 w-48 shadow-lg animate-pulse">
                        <CardContent className="p-3 text-center">
                          <div className="flex justify-center text-yellow-400 mb-1">
                            <Star className="w-4 h-4 fill-current"/>
                            <Star className="w-4 h-4 fill-current"/>
                            <Star className="w-4 h-4 fill-current"/>
                            <Star className="w-4 h-4 fill-current"/>
                            <Star className="w-4 h-4 fill-current"/>
                          </div>
                          <p className="text-xs text-muted-foreground">+1500 trabajos completados</p>
                        </CardContent>
                      </Card>
                  </div>
              </div>
           </div>
        </section>

        <StatsSection />

        <section id="servicios" className="py-12 md:py-24">
          <div className="container">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tighter md:text-4xl">
                ¿Qué problema resolvemos hoy?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Desde la gotera más pequeña hasta la remodelación que sueñas. Tenemos al profesional ideal para cada necesidad de tu hogar en Quito.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <Card key={service.title} className="text-center transition-transform hover:-translate-y-2 hover:shadow-xl">
                  <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      {service.icon}
                    </div>
                    <CardTitle className="font-bold">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="py-12 md:py-24 bg-gradient-to-r from-primary to-secondary text-white">
            <div className="container">
                 <div className="text-center mb-12 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-extrabold tracking-tighter md:text-4xl">Así de simple es tenerlo resuelto.</h2>
                    <p className="mt-4 text-lg text-white/80">Olvídate de las complicaciones. En 3 pasos, tu problema es historia.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 hidden md:block" />
                    <div className="flex flex-col items-center z-10">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/20 border-2 border-white text-white font-bold text-2xl mb-4">1</div>
                        <h3 className="text-xl font-semibold mb-2">Describe tu Problema</h3>
                        <p className="text-white/80">Cuéntanos qué necesitas con nuestro formulario. Es rápido, fácil y sin compromiso.</p>
                    </div>
                     <div className="flex flex-col items-center z-10">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/20 border-2 border-white text-white font-bold text-2xl mb-4">2</div>
                        <h3 className="text-xl font-semibold mb-2">Recibe una Cotización Clara</h3>
                        <p className="text-white/80">Un técnico calificado analizará tu caso y te enviará una cotización justa y transparente.</p>
                    </div>
                     <div className="flex flex-col items-center z-10">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/20 border-2 border-white text-white font-bold text-2xl mb-4">3</div>
                        <h3 className="text-xl font-semibold mb-2">¡Misión Cumplida!</h3>
                        <p className="text-white/80">El técnico realiza el trabajo en la fecha acordada y tú pagas de forma segura al finalizar. ¡Así de fácil!</p>
                    </div>
                </div>
            </div>
        </section>

         <section id="confianza" className="py-12 md:py-24 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tighter md:text-4xl">
                Tu Tranquilidad es Nuestra Prioridad
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Más que un servicio, te ofrecemos la certeza de un trabajo bien hecho. Estos son nuestros pilares:
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {whyChooseUs.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center p-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-6 shadow-lg">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="py-20 text-center bg-primary text-primary-foreground">
           <div className="container max-w-2xl">
             <h2 className="text-3xl font-extrabold tracking-tighter md:text-4xl">¿Listo para decir "problema resuelto"?</h2>
             <p className="mt-4 text-lg text-primary-foreground/80">No dejes que una pequeña avería te quite el sueño (o el agua caliente). El primer paso para solucionarlo está aquí.</p>
             <div className="mt-8">
               <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                      Solicitar mi Servicio Ahora
                    </Button>
                  </DialogTrigger>
                   <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle>Habla con un Experto</DialogTitle>
                      <DialogDescription>
                        Completa el formulario y te contactaremos para asesorarte sin costo.
                      </DialogDescription>
                    </DialogHeader>
                    <DemoRequestForm onSuccess={() => setIsServiceDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
           </div>
        </section>

      </main>

      <footer id="contacto" className="border-t bg-slate-900 text-slate-300">
        <div className="container py-12">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div className="col-span-1 md:col-span-2">
                    <Link href="/" className="flex items-center gap-2 mb-4">
                        <MaestroYaLogo className="h-8 w-8 text-primary" />
                        <span className="font-bold text-lg text-white">MaestroYa</span>
                    </Link>
                    <p className="text-sm text-slate-400 max-w-md">La plataforma líder en Quito que conecta hogares con maestros profesionales de confianza. Simplificamos la gestión de servicios del hogar.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Servicios</h3>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#servicios" className="text-slate-400 hover:text-primary">Plomería</a></li>
                        <li><a href="#servicios" className="text-slate-400 hover:text-primary">Electricidad</a></li>
                        <li><a href="#servicios" className="text-slate-400 hover:text-primary">Albañilería</a></li>
                        <li><a href="#servicios" className="text-slate-400 hover:text-primary">Todos los servicios</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">Contacto</h3>
                     <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-slate-400">Teléfono: 098 753 1450</li>
                        <li className="flex items-center gap-2 text-slate-400">Email: contacto@maestroya.com</li>
                     </ul>
                </div>
            </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
            <p className="text-slate-500">
              &copy; {new Date().getFullYear()} MaestroYa. Todos los derechos reservados.
            </p>
             <div className="flex gap-4 mt-4 md:mt-0">
                <Link href="/politicas" className="text-slate-500 hover:text-primary">Políticas de Servicio</Link>
                <Link href="/politicas" className="text-slate-500 hover:text-primary">Términos y Condiciones</Link>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
