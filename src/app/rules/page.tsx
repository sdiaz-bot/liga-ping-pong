export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">📋 Reglamento de la Liga</h1>

      <div className="bg-white rounded-xl shadow-sm border border-border p-6 sm:p-8 space-y-8">
        <Section title="1. Formato General">
          <ul className="list-disc pl-5 space-y-2">
            <li>La liga consta de dos fases: <strong>Round Robin</strong> (todos contra todos) y <strong>Playoffs</strong> (eliminación directa).</li>
            <li>Todos los jugadores inscritos juegan contra todos los demás en la fase de Round Robin.</li>
            <li>Los mejores clasificados avanzan a la fase de Playoffs.</li>
          </ul>
        </Section>

        <Section title="2. Formato de Partidos">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Round Robin:</strong> Mejor de 3 sets (el primero en ganar 2 sets gana el partido).</li>
            <li><strong>Playoffs:</strong> Mejor de 5 sets (el primero en ganar 3 sets gana el partido).</li>
            <li>Cada set se juega a <strong>11 puntos</strong>.</li>
            <li>Se debe ganar por <strong>diferencia de 2 puntos</strong> (si llega a 10-10, se sigue hasta que alguien tenga 2 de ventaja).</li>
            <li>El servicio cambia cada 2 puntos.</li>
          </ul>
        </Section>

        <Section title="3. Sistema de Puntuación">
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-bold text-primary text-2xl">3</span>
                <p className="text-text-muted">puntos por Victoria</p>
              </div>
              <div>
                <span className="font-bold text-accent text-2xl">1</span>
                <p className="text-text-muted">punto por Derrota</p>
              </div>
              <div>
                <span className="font-bold text-danger text-2xl">0</span>
                <p className="text-text-muted">puntos por No Presentarse</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="4. Desempates">
          <p className="mb-2">En caso de empate en puntos, se resuelve en este orden:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Enfrentamiento directo</strong> entre los jugadores empatados.</li>
            <li><strong>Diferencia de sets</strong> (sets ganados menos sets perdidos).</li>
            <li><strong>Diferencia de puntos</strong> (puntos anotados menos puntos recibidos).</li>
          </ol>
        </Section>

        <Section title="5. Programación de Partidos">
          <ul className="list-disc pl-5 space-y-2">
            <li>Los partidos se programan en los horarios habilitados por el administrador.</li>
            <li>Cada slot es de <strong>30 minutos</strong> (suficiente para un mejor de 3).</li>
            <li>Los jugadores pueden jugar <strong>fuera del horario programado</strong> y registrar el resultado en el portal.</li>
            <li>Si un jugador no se presenta al partido programado sin avisar, se considera <strong>forfeit</strong> (el rival gana automáticamente).</li>
          </ul>
        </Section>

        <Section title="6. Registro de Resultados">
          <ul className="list-disc pl-5 space-y-2">
            <li>Cualquiera de los dos jugadores puede registrar el resultado usando su <strong>código de acceso</strong>.</li>
            <li>Se deben registrar los puntos de <strong>cada set</strong> individualmente.</li>
            <li>En caso de discrepancia, el administrador resolverá.</li>
          </ul>
        </Section>

        <Section title="7. Playoffs">
          <ul className="list-disc pl-5 space-y-2">
            <li>Clasifican los <strong>mejores 8 o 16 jugadores</strong> del Round Robin (según configuración).</li>
            <li>El seeding respeta la posición final: el 1ro juega contra el último clasificado, el 2do contra el penúltimo, etc.</li>
            <li>Eliminación directa: quien pierde, queda eliminado.</li>
            <li>Se juega partido por el <strong>tercer puesto</strong> entre los perdedores de semifinales.</li>
          </ul>
        </Section>

        <Section title="8. Conducta">
          <ul className="list-disc pl-5 space-y-2">
            <li>Se espera <strong>deportividad y respeto</strong> en todo momento.</li>
            <li>Cualquier conducta antideportiva será evaluada por el administrador.</li>
            <li>¡Lo más importante es divertirse! 🏓</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </div>
  );
}
