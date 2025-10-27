
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PoliticasPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Políticas y Estándares de MaestroYa CRM</CardTitle>
        <CardDescription>
          Documentos oficiales sobre privacidad, cancelación de servicios, garantía de satisfacción y procedimientos técnicos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="privacidad" orientation="vertical" className="flex flex-col md:flex-row gap-8">
          <TabsList className="w-full md:w-1/4">
            <TabsTrigger value="privacidad" className="w-full justify-start">Privacidad</TabsTrigger>
            <TabsTrigger value="cancelacion" className="w-full justify-start">Cancelación</TabsTrigger>
            <TabsTrigger value="satisfaccion" className="w-full justify-start">Garantía de Satisfacción</TabsTrigger>
            <TabsTrigger value="sops" className="w-full justify-start">SOPs Técnicos</TabsTrigger>
            <TabsTrigger value="responsabilidades" className="w-full justify-start">Responsabilidades</TabsTrigger>
            <TabsTrigger value="reclamos" className="w-full justify-start">Reclamos</TabsTrigger>
          </TabsList>
          
          <div className="flex-1">
            <TabsContent value="privacidad" className="mt-0 prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Política de Privacidad</h3>
              <p>
                MaestroYa CRM se compromete firmemente con la protección y confidencialidad de los datos de sus clientes. Toda información personal —como nombres, direcciones y detalles de servicio— se utiliza exclusivamente para mejorar y operar nuestros servicios.
              </p>
              <p>
                No compartimos sus datos con terceros sin su consentimiento explícito, salvo requerimiento legal. Aplicamos estrictos protocolos de seguridad, cumpliendo las normativas vigentes para resguardo de la información.
              </p>
            </TabsContent>
            
            <TabsContent value="cancelacion" className="mt-0 prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Política de Cancelación</h3>
              <p>
                Usted puede cancelar su servicio hasta 24 horas antes de la cita programada sin penalización. Cancelaciones dentro de las 24 horas previas pueden incurrir en una tarifa mínima para cubrir costos logísticos. No es posible cancelar una vez iniciado el diagnóstico o reparación por parte del técnico.
              </p>
            </TabsContent>
            
            <TabsContent value="satisfaccion" className="mt-0 prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Garantía de Satisfacción</h3>
              <p>
                Todos nuestros servicios de reparación tienen garantía de 90 días. Si el mismo inconveniente reaparece dentro de este período, reubicaremos un técnico sin costo adicional. La garantía cubre mano de obra y piezas proporcionadas por MaestroYa CRM.
              </p>
            </TabsContent>
            
            <TabsContent value="sops" className="mt-0 prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Procedimientos Operativos Estándar (SOPs)</h3>
              <p>Nuestros técnicos siguen rigurosos procesos técnicos y de seguridad para asegurar la calidad de cada servicio, tales como:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Diagnóstico estructurado y documentado de cada caso</li>
                <li>Protocolos de seguridad eléctrica</li>
                <li>Uso responsable de herramientas y materiales</li>
                <li>Entrega de informe detallado al finalizar</li>
              </ul>
              <p className="mt-4">
                Revisamos y actualizamos frecuentemente los SOPs para adaptarnos a los avances tecnológicos y las mejores prácticas internacionales.
              </p>
            </TabsContent>

            <TabsContent value="responsabilidades" className="mt-0 prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Responsabilidades del Cliente</h3>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Brindar información veraz y completa sobre el problema o servicio requerido.</li>
                <li>Permitir el acceso seguro al técnico, facilitando las condiciones adecuadas para la intervención.</li>
                <li>Revisar y confirmar el informe de servicio entregado por el técnico al finalizar el trabajo.</li>
                <li>Notificar oportunamente cualquier inconveniente posterior a la prestación del servicio, para ejercer la garantía.</li>
                <li>Respetar los términos de cancelación y pagos acordados en la contratación del servicio.</li>
              </ul>
            </TabsContent>

            <TabsContent value="reclamos" className="mt-0 prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Atención de Reclamos</h3>
              <p>
                MaestroYa CRM pone a disposición de sus clientes canales formales de reclamo y atención post-servicio. Cualquier inconveniente puede ser reportado a través del formulario web, vía telefónica, o mediante el correo oficial de soporte.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Todos los reclamos serán atendidos en un plazo máximo de 48 horas hábiles.</li>
                <li>Se asignará un responsable para dar seguimiento y solución.</li>
                <li>Podrás solicitar revisión técnica por garantía o discordancia en el servicio realizado.</li>
              </ul>
              <p>
                Valoramos y priorizamos la satisfacción de nuestros clientes: cada caso es gestionado con seriedad y profesionalismo.
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
