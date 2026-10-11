import { ArrowUpRight, Sprout } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <Badge variant="secondary" className="mb-5">
          En configuración
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frontend preparado</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          El primer paso para comprender las inasistencias y acompañar mejor cada reserva.
        </p>
      </div>
      <Card className="overflow-hidden border-primary/15 bg-linear-to-br from-primary/5 via-card to-card shadow-none">
        <CardContent className="p-7 sm:p-10">
          <div className="mb-8 flex size-14 items-center justify-center rounded-2xl border border-primary/15 bg-background text-primary">
            <Sprout aria-hidden="true" className="size-7" />
          </div>
          <p className="mb-3 text-xs font-medium tracking-widest text-primary uppercase">
            Un comienzo con propósito
          </p>
          <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
            Más claridad para planificar el cuidado.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            La estructura de navegación y los componentes base están listos. Las reservas, los
            reportes y los modelos se incorporarán progresivamente.
          </p>
          <Button asChild className="mt-7">
            <Link href="/reservations">
              Explorar reservas <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <div className="max-w-2xl border-l-2 border-primary/30 pl-5">
        <h2 className="text-sm font-medium">Una base lista para crecer</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Esta etapa prepara la aplicación. Aún no contiene datos de clientes, conexiones con las
          API ni predicciones de inasistencia.
        </p>
      </div>
    </div>
  );
}
