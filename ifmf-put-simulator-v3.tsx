import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart
} from 'recharts';
import {
  Info, RotateCcw, TrendingDown, TrendingUp, Shield, X, ChevronRight, ChevronDown,
  BookOpen, GraduationCap, Lightbulb, ArrowRight, ArrowLeft, Play,
  Clock, Target, AlertCircle, Sparkles, CheckCircle2, Scale, Coins
} from 'lucide-react';

// ============================================================
// DESIGN TOKENS
// ============================================================
const tokens = {
  bg: '#0A0E1A',
  surface: '#111727',
  surfaceElevated: '#1A2236',
  textPrimary: '#E5E9F2',
  textSecondary: '#8B93A7',
  textTertiary: '#5A6378',
  accent: '#3B82F6',
  profit: '#10B981',
  loss: '#EF4444',
  strike: '#F59E0B',
  border: '#1F2937',
  borderHover: '#374151',
};

// ============================================================
// FORMATO ESPAÑOL
// ============================================================
const fmtEUR = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '— €';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR',
    maximumFractionDigits: 2, minimumFractionDigits: 2,
  }).format(n);
};

const fmtNum = (n, decimals = 2) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: decimals, minimumFractionDigits: decimals,
  }).format(n);
};

// ============================================================
// CASOS GUIADOS
// ============================================================
const CASOS = [
  {
    id: 'caso1',
    titulo: 'Protección ante caída del mercado',
    descripcion: 'Tienes acciones y temes una caída. Observa cómo la PUT actúa como seguro financiero.',
    dificultad: 'Básico',
    modo: 'especulativa',
    icono: Shield,
    color: tokens.profit,
    valores: {
      S0: 100, K: 95, prima: 4, T: 90, contratos: 1,
      nAcciones: 100, S0Compra: 100, ST: 85, Tslider: 90,
    },
    sugerencia: 'Mueve el "Precio al vencimiento (S_T)" entre 70 € y 110 € y observa cómo cambia la línea verde (cartera cubierta).',
    objetivos: ['Cobertura', 'Suelo de pérdidas', 'Protección financiera'],
    tour: [
      {
        target: 'panel-variables',
        titulo: '1. Tu situación de partida',
        texto: 'Tienes 100 acciones compradas a 100 € cada una. Total invertido: 10.000 €. Compras 1 PUT con E = 95 € pagando una prima P = 4 €/acción → P total = 400 € (4 × 100).',
        pos: 'right',
      },
      {
        target: 'panel-explorar',
        titulo: '2. Imagina que el mercado cae',
        texto: 'Mueve el slider azul "Precio al vencimiento" hacia la izquierda, hasta 80 €. Verás cómo cambia tu P/L total en tiempo real.',
        pos: 'right',
        accion: { setter: 'setST', valor: 80 },
      },
      {
        target: 'grafico-payoff',
        titulo: '3. El efecto seguro',
        texto: 'Fíjate en la línea verde (cartera cubierta): por debajo de E = 95 €, deja de bajar. Ese es tu "suelo" de pérdidas. Sin la PUT (línea gris punteada), seguirías perdiendo.',
        pos: 'left',
      },
      {
        target: 'metricas',
        titulo: '4. Tu pérdida máxima',
        texto: 'Mira el "Suelo cartera cubierta": sea cual sea la caída, no perderás más que esta cantidad. Es el coste real del seguro: la franquicia (caída de S hasta E) + la prima P.',
        pos: 'left',
      },
      {
        target: 'panel-interpretacion',
        titulo: '5. La lección clave',
        texto: 'Una PUT como cobertura no elimina las pérdidas pequeñas, pero te protege de las catastróficas. Igual que el seguro del coche: tienes franquicia, pero te cubre el desastre.',
        pos: 'top',
      },
    ],
  },
  {
    id: 'caso2',
    titulo: 'El mercado se desploma',
    descripcion: 'Crees que el mercado caerá bruscamente y compras una PUT para beneficiarte.',
    dificultad: 'Básico',
    modo: 'especulativa',
    icono: TrendingDown,
    color: tokens.loss,
    valores: {
      S0: 100, K: 100, prima: 5, T: 60, contratos: 1,
      nAcciones: 100, S0Compra: 100, ST: 80, Tslider: 60,
    },
    sugerencia: 'Lleva el "Precio al vencimiento (S_T)" a valores bajos (70-85 €) y observa cómo crece el beneficio.',
    objetivos: ['Payoff bajista', 'Beneficio creciente', 'Pérdida limitada'],
    tour: [
      {
        target: 'panel-variables',
        titulo: '1. Tu apuesta',
        texto: 'No tienes acciones. Compras 1 PUT con E = 100 € y P = 5 €. Ganarás si S_T < E − P = 95 €. Por debajo de ahí: B/P = max(0, E − S_T) − P > 0.',
        pos: 'right',
      },
      {
        target: 'panel-explorar',
        titulo: '2. Mueve el precio hacia abajo',
        texto: 'Lleva el slider de S_T desde 100 € hacia 80 €. Mira cómo el P/L pasa de negativo (pierdes la prima P) a positivo: max(0, E − S_T) − P > 0.',
        pos: 'right',
      },
      {
        target: 'grafico-payoff',
        titulo: '3. Forma de "L" invertida',
        texto: 'Esta es la firma visual de una PUT comprada: cuanto más cae el precio, más ganas. Pero si el precio sube, tu pérdida está limitada a la prima P (línea horizontal a la derecha de E).',
        pos: 'left',
      },
      {
        target: 'metricas',
        titulo: '4. El apalancamiento',
        texto: 'Con solo 500 € controlas el efecto de 100 acciones. Si las acciones caen un 20%, ganas mucho más que el 20% sobre tu inversión. Eso es apalancamiento.',
        pos: 'left',
      },
      {
        target: 'panel-interpretacion',
        titulo: '5. La lección clave',
        texto: 'Comprar una PUT permite ganar con caídas sin tener que vender en corto. Pérdida limitada a P, beneficio potencialmente grande cuando S cae.',
        pos: 'top',
      },
    ],
  },
  {
    id: 'caso3',
    titulo: 'La PUT tiene valor, pero aún pierdes',
    descripcion: 'El mercado cae ligeramente, pero no lo suficiente para que max(0, E − S_T) supere la prima P.',
    dificultad: 'Intermedio',
    modo: 'especulativa',
    icono: AlertCircle,
    color: tokens.strike,
    valores: {
      S0: 100, K: 100, prima: 5, T: 30, contratos: 1,
      nAcciones: 100, S0Compra: 100, ST: 97, Tslider: 30,
    },
    sugerencia: 'Observa la fila de la tabla resaltada en azul. La PUT tiene valor intrínseco max(0, E − S_T) = 3 € pero la prima P fue 5 €. Mueve S_T para encontrar el punto exacto donde dejas de perder.',
    objetivos: ['Diferencia entre tener razón y ganar dinero', 'Impacto de la prima P', 'Break-even'],
    tour: [
      {
        target: 'panel-explorar',
        titulo: '1. Tenías razón... pero no del todo',
        texto: 'El precio cayó de 100 € a 97 €. La PUT vale max(0, E − S_T) = max(0, 100 − 97) = 3 €. Pero pagaste P = 5 €. B/P = 3 − 5 = −2 €/acción → −200 € por contrato.',
        pos: 'right',
      },
      {
        target: 'tabla-escenarios',
        titulo: '2. Mira la tabla',
        texto: 'La columna "V. intrín." muestra el valor que tiene la PUT al ejercerla. La columna "P/L total" muestra que aún restando P, sigues en pérdidas. Solo cuando S_T < E − P = 95 € compensas el coste.',
        pos: 'left',
      },
      {
        target: 'grafico-payoff',
        titulo: '3. El break-even',
        texto: 'La línea punteada blanca marca el break-even: el precio exacto donde tu P/L = 0. Break-even = E − P = 100 − 5 = 95 €. Con cualquier S_T < 95 €: B/P > 0.',
        pos: 'left',
      },
      {
        target: 'panel-explorar',
        titulo: '4. Encuentra el equilibrio',
        texto: 'Mueve S_T hasta 95 €. Verás P/L = 0 €. Ahí está el límite: tener razón en la dirección no basta: S tiene que caer lo suficiente para cubrir la prima P.',
        pos: 'right',
        accion: { setter: 'setST', valor: 95 },
      },
      {
        target: 'panel-interpretacion',
        titulo: '5. La lección clave',
        texto: 'En opciones, predecir la dirección es solo la mitad del juego. La otra mitad es predecir la magnitud: la prima P determina el umbral de rentabilidad: B/P PUT = max(0, E − S_T) − P > 0 solo si S_T < E − P.',
        pos: 'top',
      },
    ],
  },
  {
    id: 'caso4',
    titulo: 'La PUT expira sin valor',
    descripcion: 'El mercado sube y la PUT pierde toda la prima P pagada.',
    dificultad: 'Básico',
    modo: 'especulativa',
    icono: Target,
    color: tokens.textSecondary,
    valores: {
      S0: 100, K: 95, prima: 4, T: 45, contratos: 1,
      nAcciones: 100, S0Compra: 100, ST: 120, Tslider: 45,
    },
    sugerencia: 'Tu pérdida es exactamente P × 100 = 400 €. Mueve S_T entre E+1 y 150 €: la pérdida no cambia. Es tu pérdida máxima.',
    objetivos: ['Pérdida máxima limitada', 'Opción OTM', 'Seguro no utilizado'],
    tour: [
      {
        target: 'panel-explorar',
        titulo: '1. Tu apuesta falló',
        texto: 'Compraste una PUT esperando una caída. En lugar de caer, el precio subió a 120 €. La PUT está OTM (fuera del dinero): no vale nada al vencimiento.',
        pos: 'right',
      },
      {
        target: 'grafico-payoff',
        titulo: '2. La línea plana',
        texto: 'Mira la línea de payoff a la derecha del precio de ejercicio (E): es horizontal, anclada en −400 € (= P × 100). Sube todo lo que quieras: max(0, E − S_T) = 0 y la pérdida = −P × 100. Eso es lo bonito de comprar opciones.',
        pos: 'left',
      },
      {
        target: 'panel-explorar',
        titulo: '3. Compruébalo',
        texto: 'Mueve S_T entre 96 € y 150 €. P/L se mantiene constante en -400 €. Esa es tu pérdida máxima, hagas lo que haga el mercado.',
        pos: 'right',
      },
      {
        target: 'metricas',
        titulo: '4. Riesgo asimétrico',
        texto: 'Pierdes máximo 400 €. Si en lugar de subir el precio hubiera caído mucho, habrías ganado miles. Pérdida acotada + beneficio potencialmente grande = el atractivo de comprar opciones.',
        pos: 'left',
      },
      {
        target: 'panel-interpretacion',
        titulo: '5. La lección clave',
        texto: 'Comprar una PUT es como comprar un seguro contra caídas. Si no hay caída, "pierdes" el seguro. Pero al menos sabías exactamente cuánto te podía costar.',
        pos: 'top',
      },
    ],
  },
  {
    id: 'caso5',
    titulo: 'Desaparición del valor temporal',
    descripcion: 'Observa cómo se evapora el valor temporal al acercarse el vencimiento.',
    dificultad: 'Intermedio',
    modo: 'especulativa',
    icono: Clock,
    color: tokens.accent,
    valores: {
      S0: 100, K: 100, prima: 6, T: 365, contratos: 1,
      nAcciones: 100, S0Compra: 100, ST: 100, Tslider: 365,
    },
    sugerencia: 'Ve al segundo gráfico ("Valor de la opción antes del vencimiento") y mueve el slider "Tiempo" desde 365 días hacia 1 día.',
    objetivos: ['Valor temporal', 'Convergencia al valor intrínseco', 'Efecto del tiempo'],
    tour: [
      {
        target: 'grafico-valor',
        titulo: '1. Dos componentes del valor',
        texto: 'Una opción tiene dos valores: el intrínseco (lo que valdría si venciera AHORA) y el temporal (valor extra por el tiempo que queda). La línea gris es el intrínseco, la azul es el total.',
        pos: 'top',
      },
      {
        target: 'slider-tiempo',
        titulo: '2. Mueve el tiempo',
        texto: 'Arrastra el slider "Tiempo" desde 365 hasta 90. Verás cómo la curva azul se va aplastando hacia la gris. El valor temporal se está evaporando.',
        pos: 'bottom',
      },
      {
        target: 'slider-tiempo',
        titulo: '3. Cerca del vencimiento',
        texto: 'Ahora llévalo a 30 días, luego a 10, luego a 1. La curva azul casi se funde con la gris. Al vencimiento, solo queda el valor intrínseco.',
        pos: 'bottom',
      },
      {
        target: 'grafico-valor',
        titulo: '4. ¿Dónde es máximo?',
        texto: 'Observa que el valor temporal es máximo cerca del precio de ejercicio (E) (línea ámbar). Las opciones ATM tienen el mayor valor temporal. Las muy ITM u OTM tienen poco valor temporal.',
        pos: 'top',
      },
      {
        target: 'grafico-valor',
        titulo: '5. La lección clave',
        texto: 'Comprar opciones es comprar tiempo. Cada día que pasa, tu opción vale menos (efecto theta), aunque el precio del subyacente no se mueva. Para el examen: el valor temporal SIEMPRE decae hacia 0.',
        pos: 'top',
      },
    ],
  },
  // ============ VENTA DE PUT — 3 CASOS ============
  {
    id: 'caso6',
    titulo: 'Cobro de prima sin asignación',
    descripcion: 'Vendes una PUT esperando que el subyacente no caiga. El comprador no ejerce y te quedas con la prima íntegra.',
    dificultad: 'Básico',
    modo: 'venta',
    icono: Coins,
    color: tokens.profit,
    valores: {
      S0: 100, K: 95, prima: 4, T: 60, contratos: 1,
      nAcciones: 100, S0Compra: 100, ST: 105, Tslider: 60,
    },
    sugerencia: 'Mueve S_T entre 95 € y 130 €. Verás que tu B/P se mantiene constante en +P. Por encima de E, el comprador no ejerce: tu beneficio máximo está garantizado.',
    objetivos: ['Beneficio máximo = P', 'OTM como mejor escenario', 'Asimetría vendedor'],
    tour: [
      {
        target: 'panel-variables',
        titulo: '1. Tu posición como vendedor',
        texto: 'Has vendido 1 PUT con E = 95 € y has cobrado P = 4 € por acción (400 € por contrato). A cambio, te obligas a comprar a 95 € si el comprador decide ejercer.',
        pos: 'right',
      },
      {
        target: 'panel-explorar',
        titulo: '2. El mercado sube a 105 €',
        texto: 'S_T = 105 € > E = 95 €. ¿Ejercerá el comprador su derecho a vender a 95 € cuando el mercado paga 105 €? No, claro. La PUT vence OTM.',
        pos: 'right',
      },
      {
        target: 'grafico-payoff',
        titulo: '3. La línea horizontal',
        texto: 'Fíjate en la curva: a la derecha de E es plana en +400 € (= P × 100). Hagas lo que hagas con S_T por encima de E, tu B/P es constante: te quedas con toda la prima.',
        pos: 'left',
      },
      {
        target: 'panel-explorar',
        titulo: '4. Compruébalo',
        texto: 'Mueve S_T desde 95 € hasta 130 €. Verás que el P/L se mantiene en +400 €. Eso es lo bonito de vender opciones: si aciertas la dirección, cobras y olvidas.',
        pos: 'right',
      },
      {
        target: 'metricas',
        titulo: '5. La lección clave',
        texto: 'Tu beneficio máximo está LIMITADO a la prima P. No importa si S sube a 105, 200 o 500: tu ganancia siempre será +P × 100 × contratos. Es la asimetría del vendedor.',
        pos: 'left',
      },
    ],
  },
  {
    id: 'caso7',
    titulo: 'Asignación con caída moderada',
    descripcion: 'El mercado cae por debajo del strike. El comprador ejerce. Tú asumes la pérdida, pero la prima cobrada la amortigua.',
    dificultad: 'Intermedio',
    modo: 'venta',
    icono: AlertCircle,
    color: tokens.strike,
    valores: {
      S0: 100, K: 100, prima: 5, T: 45, contratos: 1,
      nAcciones: 100, S0Compra: 100, ST: 97, Tslider: 45,
    },
    sugerencia: 'S_T = 97 €, E = 100 €. La PUT está ITM y el comprador ejerce. Pero como cobraste P = 5 €, todavía tienes B/P positivo. Mueve S_T hacia 95 € (break-even) y luego más abajo.',
    objetivos: ['Asignación ITM', 'Prima amortigua la pérdida', 'Break-even simétrico'],
    tour: [
      {
        target: 'panel-explorar',
        titulo: '1. El precio cae a 97 €',
        texto: 'S_T = 97 € < E = 100 €. El comprador ejerce su derecho a venderte acciones a 100 € cuando el mercado solo paga 97 €. Estás OBLIGADO a comprar.',
        pos: 'right',
      },
      {
        target: 'tabla-escenarios',
        titulo: '2. Mira la columna "¿Se ejercita?"',
        texto: 'En las filas donde S_T < E, la columna marca "Sí". Como vendedor, no decides tú: respondes a la decisión del comprador. Solo te queda calcular cuánto pierdes (o ganas).',
        pos: 'left',
      },
      {
        target: 'panel-explorar',
        titulo: '3. ¿Pero estás en pérdida?',
        texto: 'Has pagado 100 € por acción que vale 97 €: pierdes 3 € por acción. PERO cobraste P = 5 €. B/P = 5 − 3 = +2 €/acción → +200 €. Aún ganas, gracias a la prima.',
        pos: 'right',
      },
      {
        target: 'grafico-payoff',
        titulo: '4. El break-even',
        texto: 'La línea punteada marca BE = E − P = 95 €. A la derecha de BE estás en beneficio. A la izquierda, en pérdida. Es exactamente el mismo break-even que el comprador, pero al otro lado.',
        pos: 'left',
      },
      {
        target: 'panel-interpretacion',
        titulo: '5. La lección clave',
        texto: 'La prima cobrada te da un "colchón" de P euros. Pierdes solo si la caída del subyacente supera ese colchón. Por eso vendedores experimentados venden PUTs OTM con primas modestas.',
        pos: 'top',
      },
    ],
  },
  {
    id: 'caso8',
    titulo: 'Caída fuerte: pérdida grande',
    descripcion: 'El subyacente se desploma. El comprador ejerce y tú asumes una pérdida muy superior a la prima cobrada.',
    dificultad: 'Intermedio',
    modo: 'venta',
    icono: TrendingDown,
    color: tokens.loss,
    valores: {
      S0: 100, K: 100, prima: 5, T: 30, contratos: 1,
      nAcciones: 100, S0Compra: 100, ST: 75, Tslider: 30,
    },
    sugerencia: 'S_T = 75 €, E = 100 €. La pérdida supera ampliamente la prima. Mueve S_T hacia 50 € y observa cómo crece la pérdida casi sin límite. Esa es la gran asimetría del vendedor.',
    objetivos: ['Pérdida casi ilimitada', 'Asimetría riesgo/beneficio', 'Riesgo del vendedor'],
    tour: [
      {
        target: 'panel-explorar',
        titulo: '1. Catástrofe en el mercado',
        texto: 'S_T = 75 € << E = 100 €. La PUT está muy ITM. El comprador ejerce: te obliga a comprar acciones a 100 € cuando valen 75 €. Pérdida en el ejercicio: 25 €/acción.',
        pos: 'right',
      },
      {
        target: 'panel-explorar',
        titulo: '2. La prima no salva nada',
        texto: 'Cobraste P = 5 €. B/P = 5 − 25 = −20 €/acción → −2.000 € por contrato. La prima amortigua pero no protege contra movimientos grandes.',
        pos: 'right',
      },
      {
        target: 'grafico-payoff',
        titulo: '3. La curva descendente',
        texto: 'Mira la línea a la izquierda del strike: cae con pendiente -1, sin suelo hasta que S = 0. En el límite, pierdes (E − P) × 100 = 9.500 € por contrato. La prima cobrada parece pequeña frente a esto.',
        pos: 'left',
      },
      {
        target: 'metricas',
        titulo: '4. La asimetría brutal',
        texto: 'Beneficio máximo: +500 €. Pérdida máxima: -9.500 €. Vender PUTs es como vender seguros: cobras pequeñas primas regulares, pero el "siniestro" puede ser devastador.',
        pos: 'left',
      },
      {
        target: 'panel-interpretacion',
        titulo: '5. La lección clave',
        texto: 'Vender PUTs sin cobertura ("naked put") es estrategia de alto riesgo. En el examen recuerda: vendedor de PUT = beneficio limitado a P, pérdida casi ilimitada. Profesionales lo combinan con otras posiciones.',
        pos: 'top',
      },
    ],
  },
];

// ============================================================
// CONTENIDO PEDAGÓGICO (Teoría)
// ============================================================
const TEORIA = [
  {
    id: 'que-es',
    titulo: '¿Qué es una opción PUT?',
    icono: '📘',
    contenido: (
      <>
        <p style={{ marginBottom: 10 }}>
          Una <strong>opción PUT</strong> es un contrato que te da el <strong>derecho</strong> (pero no la obligación)
          de <strong>vender</strong> un activo a un precio fijo en una fecha futura.
        </p>
        <p style={{ marginBottom: 10 }}>
          Piénsalo como un <strong>seguro contra caídas</strong>: pagas una pequeña cantidad ahora (la prima P)
          para asegurar que, si el precio cae, puedes venderlo a un precio acordado en lugar del precio real del mercado.
        </p>
        <div style={{
          padding: 10, borderRadius: 6,
          backgroundColor: `${tokens.accent}15`,
          border: `1px solid ${tokens.accent}30`,
          fontSize: 11, lineHeight: 1.5,
        }}>
          <strong>Ejemplo cotidiano:</strong> Tienes una bicicleta que vale 500 €. Pagas 20 € por un seguro que
          te garantiza venderla por 450 € si se daña. Si se rompe, ejerces el seguro. Si no, pierdes los 20 €.
          La PUT es ese seguro, pero para acciones.
        </div>
      </>
    ),
  },
  {
    id: 'variables',
    titulo: 'Las 4 variables clave',
    icono: '🎚️',
    contenido: (
      <>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: tokens.accent }}>Subyacente (S):</strong>{' '}
          <span style={{ color: tokens.textSecondary }}>
            El activo cuya caída quieres asegurar (ejemplo: acción de Telefónica).
          </span>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: tokens.strike }}>Precio de ejercicio (E):</strong>{' '}
          <span style={{ color: tokens.textSecondary }}>
            Precio al que tienes derecho a vender. Es el "suelo" que pones a la caída.
          </span>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: tokens.loss }}>Prima (p):</strong>{' '}
          <span style={{ color: tokens.textSecondary }}>
            Lo que pagas por tener este derecho. Es tu pérdida máxima si compras una PUT.
          </span>
        </div>
        <div>
          <strong style={{ color: tokens.profit }}>Vencimiento (T):</strong>{' '}
          <span style={{ color: tokens.textSecondary }}>
            Hasta cuándo dura tu derecho. Pasado este día, la opción caduca.
          </span>
        </div>
      </>
    ),
  },
  {
    id: 'especulacion',
    titulo: 'PUT como apuesta bajista',
    icono: '📉',
    contenido: (
      <>
        <p style={{ marginBottom: 10 }}>
          Si crees que el precio de una acción <strong>va a caer</strong>, comprar una PUT te permite
          ganar dinero con esa caída sin tener que vender en corto.
        </p>
        <ul style={{ marginLeft: 16, marginBottom: 10, listStyle: 'disc' }}>
          <li style={{ marginBottom: 4 }}>Si el precio cae <strong>por debajo del precio de ejercicio (E)</strong>, ganas la diferencia.</li>
          <li style={{ marginBottom: 4 }}>Si cae <strong>por debajo de E − P</strong>, ganas dinero neto.</li>
          <li>Si el precio <strong>sube o no cae lo suficiente</strong>, pierdes la prima P.</li>
        </ul>
        <div style={{
          padding: 10, borderRadius: 6,
          backgroundColor: `${tokens.profit}15`,
          border: `1px solid ${tokens.profit}30`,
          fontSize: 11, lineHeight: 1.5,
        }}>
          <strong>Ventaja:</strong> tu pérdida máxima está limitada (solo pierdes la prima P),
          pero tu beneficio puede ser muy grande si el precio cae mucho. Esto es el <strong>apalancamiento</strong>.
        </div>
      </>
    ),
  },
  {
    id: 'cobertura',
    titulo: 'PUT como seguro de cartera',
    icono: '🛡️',
    contenido: (
      <>
        <p style={{ marginBottom: 10 }}>
          Si ya tienes acciones y temes que su precio caiga, comprar una PUT actúa como un{' '}
          <strong>seguro</strong> que limita tu pérdida máxima.
        </p>
        <ul style={{ marginLeft: 16, marginBottom: 10, listStyle: 'disc' }}>
          <li style={{ marginBottom: 4 }}>Si las acciones <strong>caen mucho</strong>, la PUT compensa la caída por debajo del precio de ejercicio (E).</li>
          <li style={{ marginBottom: 4 }}>Si las acciones <strong>suben</strong>, ganas con las acciones, pero pierdes la prima P del seguro.</li>
          <li>Tu pérdida máxima está <strong>acotada</strong>, pero tu beneficio se reduce por el coste del seguro.</li>
        </ul>
        <div style={{
          padding: 10, borderRadius: 6,
          backgroundColor: `${tokens.strike}15`,
          border: `1px solid ${tokens.strike}30`,
          fontSize: 11, lineHeight: 1.5,
        }}>
          <strong>Idea clave:</strong> es como el seguro de tu coche. Pagas cada año aunque no tengas accidente,
          pero si pasa algo grave, la compañía cubre el daño. La PUT cubre la caída del precio.
        </div>
      </>
    ),
  },
  {
    id: 'venta-put',
    titulo: 'Venta de PUT: el otro lado',
    icono: '💰',
    contenido: (
      <>
        <p style={{ marginBottom: 10 }}>
          Hasta ahora has aprendido a <strong>comprar</strong> PUTs. Pero alguien tiene que estar al otro lado del
          contrato: el <strong>vendedor</strong>. Toda PUT comprada implica una PUT vendida.
        </p>
        <p style={{ marginBottom: 10 }}>
          El vendedor de PUT:
        </p>
        <ul style={{ marginLeft: 16, marginBottom: 10, listStyle: 'disc' }}>
          <li style={{ marginBottom: 4 }}><strong>Cobra</strong> la prima P al inicio.</li>
          <li style={{ marginBottom: 4 }}>Asume la <strong>obligación</strong> de comprar a precio E si el comprador ejerce.</li>
          <li style={{ marginBottom: 4 }}>Su <strong>beneficio máximo es la prima cobrada</strong>: B/P máx = +P.</li>
          <li>Pierde si el precio cae por debajo de E − P (break-even, igual que el comprador pero invertido).</li>
        </ul>
        <p style={{ marginBottom: 10 }}>
          La fórmula es la inversa de la compra:
        </p>
        <div style={{
          padding: 8, borderRadius: 6, marginBottom: 10,
          backgroundColor: tokens.bg, fontFamily: 'ui-monospace, monospace',
          textAlign: 'center', fontSize: 12,
        }}>
          <strong>B/P venta PUT = P − max(0, E − S)</strong>
        </div>
        <div style={{
          padding: 10, borderRadius: 6,
          backgroundColor: `${tokens.loss}15`,
          border: `1px solid ${tokens.loss}30`,
          fontSize: 11, lineHeight: 1.5,
        }}>
          <strong>⚠️ Asimetría del vendedor:</strong> tu beneficio máximo es pequeño y conocido (la prima),
          pero tu pérdida puede ser muy grande si el subyacente se desploma. Es como vender un seguro:
          cobras una prima modesta, pero asumes el riesgo del siniestro.
        </div>
      </>
    ),
  },
  {
    id: 'glosario',
    titulo: 'Glosario rápido',
    icono: '📖',
    contenido: (
      <>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: tokens.profit }}>ITM (in-the-money / dentro del dinero):</strong>
          <p style={{ color: tokens.textSecondary, marginTop: 2 }}>
            La opción tiene valor intrínseco. Para una PUT: cuando S_T &lt; E → max(0, E − S_T) &gt; 0.
          </p>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: tokens.strike }}>ATM (at-the-money / en el dinero):</strong>
          <p style={{ color: tokens.textSecondary, marginTop: 2 }}>
            E y precio del subyacente son iguales. S_T ≈ E.
          </p>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: tokens.loss }}>OTM (out-of-the-money / fuera del dinero):</strong>
          <p style={{ color: tokens.textSecondary, marginTop: 2 }}>
            La opción no se ejercerá. Para una PUT: cuando S_T &gt; E → max(0, E − S_T) = 0.
          </p>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: tokens.accent }}>Break-even (punto de equilibrio):</strong>
          <p style={{ color: tokens.textSecondary, marginTop: 2 }}>
            Precio del subyacente donde no ganas ni pierdes. Para una PUT comprada: E − P.
          </p>
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: tokens.textPrimary }}>Valor intrínseco:</strong>
          <p style={{ color: tokens.textSecondary, marginTop: 2 }}>
            max(0, E − S). Para la PUT: diferencia entre el precio de ejercicio E y el subyacente S, si es positiva.
          </p>
        </div>
        <div>
          <strong style={{ color: tokens.textPrimary }}>Valor temporal:</strong>
          <p style={{ color: tokens.textSecondary, marginTop: 2 }}>
            Valor extra por el tiempo que queda hasta el vencimiento. Al vencimiento: Valor total → max(0, E − S).
          </p>
        </div>
      </>
    ),
  },
];

const TOOLTIPS = {
  S0: 'Precio del subyacente (S): precio actual del activo en el mercado. Es tu punto de partida para calcular el valor intrínseco max(0, E − S).',
  K: 'Precio de ejercicio (E): el precio al que tienes derecho a vender. Si S cae por debajo de E, la PUT tiene valor. Un E más alto protege más pero cuesta más prima P.',
  prima: 'Prima (P): lo que pagas por el derecho de venta. Tu pérdida máxima si compras la PUT. Fórmula completa: B/P PUT = max(0, E − S) − P.',
  T: 'Días al vencimiento: cuanto más tiempo queda, mayor es el valor temporal de la opción. Cuando T → 0, el valor total converge a max(0, E − S).',
  contratos: 'Número de contratos. Cada contrato cubre 100 acciones. El P/L total = [max(0, E − S_T) − P] × 100 × contratos.',
  ST: 'Precio del subyacente (S) al vencimiento. Muévelo para explorar. El B/P PUT = max(0, E − S_T) − P se actualiza en tiempo real.',
};

// ============================================================
// COMPONENTES BASE
// ============================================================
const Card = ({ children, className = '', elevated = false, id }) => (
  <div id={id} className={`rounded-xl p-5 ${className}`}
    style={{
      backgroundColor: elevated ? tokens.surfaceElevated : tokens.surface,
      border: `1px solid ${tokens.border}`,
    }}>
    {children}
  </div>
);

const LabeledSlider = ({ label, value, onChange, min, max, step = 1, unit = '€', tooltip, accent = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className={`mb-4 ${accent ? 'p-3 rounded-lg' : ''}`}
         style={accent ? { backgroundColor: tokens.surfaceElevated, border: `1px solid ${tokens.accent}40` } : {}}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <label style={{ color: tokens.textSecondary, fontSize: '11px' }}>{label}</label>
          {tooltip && (
            <div className="relative">
              <Info size={12} style={{ color: tokens.textTertiary, cursor: 'help' }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)} />
              {showTooltip && (
                <div className="absolute left-5 top-0 z-30 px-3 py-2 rounded-md"
                  style={{
                    backgroundColor: tokens.surfaceElevated, color: tokens.textPrimary,
                    border: `1px solid ${tokens.borderHover}`,
                    width: '260px', lineHeight: 1.5, fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}>
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>
        <input type="number" value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min} max={max} step={step}
          className="text-right px-2 py-1 rounded w-20 outline-none"
          style={{
            backgroundColor: tokens.bg,
            color: accent ? tokens.accent : tokens.textPrimary,
            border: `1px solid ${tokens.border}`,
            fontFamily: 'ui-monospace, monospace', fontWeight: 500, fontSize: '11px',
          }} />
      </div>
      <input type="range" value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min} max={max} step={step} className="w-full"
        style={{ accentColor: accent ? tokens.accent : tokens.textSecondary }} />
      <div className="flex justify-between mt-0.5"
        style={{ color: tokens.textTertiary, fontFamily: 'ui-monospace, monospace', fontSize: '10px' }}>
        <span>{fmtNum(min, 0)}{unit}</span>
        <span>{fmtNum(max, 0)}{unit}</span>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value, color = null }) => (
  <div className="flex justify-between items-center py-1.5 border-b last:border-b-0"
       style={{ borderColor: tokens.border }}>
    <span style={{ color: tokens.textSecondary, fontSize: '11px' }}>{label}</span>
    <span style={{
      color: color || tokens.textPrimary,
      fontFamily: 'ui-monospace, monospace', fontWeight: 500, fontSize: '12px',
    }}>{value}</span>
  </div>
);

const Tab = ({ active, onClick, children }) => (
  <button onClick={onClick} className="px-3 py-2 transition-all"
    style={{
      color: active ? tokens.textPrimary : tokens.textSecondary,
      borderBottom: `2px solid ${active ? tokens.accent : 'transparent'}`,
      backgroundColor: 'transparent', fontWeight: active ? 500 : 400, fontSize: '12px',
    }}>
    {children}
  </button>
);

const ConceptoClave = ({ children }) => (
  <div className="mt-2 px-3 py-2 rounded-md flex items-start gap-2"
       style={{
         backgroundColor: `${tokens.accent}10`,
         border: `1px solid ${tokens.accent}25`,
       }}>
    <Lightbulb size={13} style={{ color: tokens.accent, marginTop: 1, flexShrink: 0 }} />
    <p style={{ color: tokens.textPrimary, fontSize: '11px', lineHeight: 1.5 }}>
      {children}
    </p>
  </div>
);

// ============================================================
// LÓGICA FINANCIERA
// ============================================================
const putPayoff = (K, ST) => Math.max(0, K - ST);
const longPutPL  = (K, ST, prima, contratos) => (putPayoff(K, ST) - prima) * 100 * contratos;
// Venta PUT (posición corta): B/P = P − max(E − S, 0)
const shortPutPL = (K, ST, prima, contratos) => (prima - putPayoff(K, ST)) * 100 * contratos;

const valorTemporal = (S, K, T) => {
  const alpha = 0.4, beta = 8;
  return alpha * Math.sqrt(T / 365) * K * Math.exp(-Math.pow((S - K) / K, 2) * beta);
};

const estadoOpcion = (K, ST) => {
  if (Math.abs(ST - K) <= 0.01 * K) return 'ATM';
  if (ST < K) return 'ITM';
  return 'OTM';
};

// Quién ejercita la PUT al vencimiento. La decisión es siempre del COMPRADOR.
// El vendedor solo "responde" a la asignación.
const seEjercita = (K, ST) => {
  if (Math.abs(ST - K) <= 0.005 * K) return 'indiferente';
  return ST < K ? 'si' : 'no';
};

const interpretar = ({ modo, K, ST, prima }) => {
  const bloques = [];

  // ============ MODO VENTA DE PUT ============
  if (modo === 'venta') {
    if (ST > K + 0.01 * K) {
      bloques.push({
        titulo: 'Estado de la opción',
        texto: 'La PUT vence **OTM**: S_T > E. El comprador **no ejerce** su derecho. Como vendedor, te quedas con la prima P íntegramente: **B/P = +P**. Es el mejor escenario.',
        tono: 'profit',
      });
    } else if (Math.abs(ST - K) <= 0.01 * K) {
      bloques.push({
        titulo: 'Estado de la opción',
        texto: 'La PUT está **ATM**: S_T ≈ E. Ejercicio indiferente para el comprador. Como vendedor, prácticamente te quedas con toda la prima: **B/P ≈ +P**.',
        tono: 'neutral',
      });
    } else if (ST > K - prima) {
      bloques.push({
        titulo: 'Estado de la opción',
        texto: 'La PUT está **ITM** (E − P < S_T < E). El comprador **ejerce**, pero como la caída es moderada, la prima P cobrada absorbe parte de la pérdida. **B/P aún positivo**: P − (E − S_T) > 0.',
        tono: 'warning',
      });
    } else {
      bloques.push({
        titulo: 'Estado de la opción',
        texto: 'La PUT está **ITM** y muy en pérdida: S_T < E − P. El comprador ejerce y como vendedor asumes la asignación. **B/P negativo**: P − (E − S_T) < 0.',
        tono: 'loss',
      });
    }

    // Bloque pedagógico clave: la asimetría
    bloques.push({
      titulo: 'Lógica del vendedor',
      texto: ST > K
        ? 'Vendiste la PUT cobrando la prima P. Como el subyacente está por encima de E, tu obligación de comprar a E no se activa. **Beneficio máximo = P** (cobrado por adelantado).'
        : 'Estás **obligado a comprar** acciones a precio E aunque el mercado pague menos. La prima P cobrada amortigua la pérdida, pero no la elimina si S cae mucho.',
      tono: ST > K ? 'profit' : 'loss',
    });

    return bloques;
  }

  // ============ MODOS DE COMPRA (especulativa y cobertura) ============
  if (ST < K - prima) {
    bloques.push({
      titulo: 'Estado de la opción',
      texto: 'La opción está **ITM (dentro del dinero)**. S_T < E − P, así que max(0, E − S_T) supera la prima P pagada. Ejercer la PUT te genera beneficio neto.',
      tono: 'profit',
    });
  } else if (ST < K) {
    bloques.push({
      titulo: 'Estado de la opción',
      texto: 'La opción está **ITM** (E − P < S_T < E). Hay valor intrínseco, pero no cubre la prima P. Ejerces para recuperar parte, pero el B/P neto es negativo.',
      tono: 'warning',
    });
  } else if (Math.abs(ST - K) <= 0.01 * K) {
    bloques.push({
      titulo: 'Estado de la opción',
      texto: 'La opción está **ATM (en el dinero)**: S_T ≈ E. Valor intrínseco = 0. Tu pérdida es exactamente la prima P.',
      tono: 'neutral',
    });
  } else {
    bloques.push({
      titulo: 'Estado de la opción',
      texto: 'La opción está **OTM (fuera del dinero)**. No la ejercerás y pierdes íntegramente la prima.',
      tono: 'loss',
    });
  }
  return bloques;
};

// ============================================================
// CARD DE CASO
// ============================================================
const CasoCard = ({ caso, isActive, onCargar, onExplicar }) => {
  const Icono = caso.icono;
  return (
    <div className="rounded-xl p-4 flex-shrink-0 transition-all"
         style={{
           width: 280, minWidth: 280,
           backgroundColor: isActive ? tokens.surfaceElevated : tokens.surface,
           border: `1px solid ${isActive ? caso.color : tokens.border}`,
           boxShadow: isActive ? `0 0 0 1px ${caso.color}30` : 'none',
         }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div style={{
            padding: 6, borderRadius: 6,
            backgroundColor: `${caso.color}20`,
          }}>
            <Icono size={14} style={{ color: caso.color }} />
          </div>
          <span style={{
            color: tokens.textTertiary, fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {caso.dificultad}
          </span>
        </div>
        {isActive && (
          <CheckCircle2 size={14} style={{ color: caso.color }} />
        )}
      </div>
      <h3 style={{
        color: tokens.textPrimary, fontSize: '13px', fontWeight: 500,
        marginBottom: 6, lineHeight: 1.3,
      }}>
        {caso.titulo}
      </h3>
      <p style={{
        color: tokens.textSecondary, fontSize: '11px',
        lineHeight: 1.5, marginBottom: 12, minHeight: 48,
      }}>
        {caso.descripcion}
      </p>
      <div className="flex gap-2">
        <button onClick={() => onCargar(caso)}
          className="flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all"
          style={{
            backgroundColor: isActive ? caso.color : tokens.surfaceElevated,
            color: isActive ? 'white' : tokens.textPrimary,
            border: isActive ? 'none' : `1px solid ${tokens.border}`,
            fontSize: '11px', fontWeight: 500,
          }}>
          {isActive ? <><CheckCircle2 size={11} /> Activo</> : <><Play size={10} /> Cargar</>}
        </button>
        <button onClick={() => onExplicar(caso)}
          className="py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-all"
          style={{
            backgroundColor: 'transparent',
            color: tokens.accent,
            border: `1px solid ${tokens.accent}40`,
            fontSize: '11px', fontWeight: 500,
          }}>
          <Sparkles size={10} /> Explícame
        </button>
      </div>
    </div>
  );
};

// ============================================================
// BANNER DE CASO ACTIVO
// ============================================================
const BannerCaso = ({ caso, onClose, onExplicar }) => {
  const Icono = caso.icono;
  return (
    <div className="rounded-xl p-3 mb-4 flex items-start gap-3"
         style={{
           backgroundColor: `${caso.color}10`,
           border: `1px solid ${caso.color}40`,
         }}>
      <div style={{
        padding: 6, borderRadius: 6, flexShrink: 0,
        backgroundColor: `${caso.color}20`,
      }}>
        <Icono size={14} style={{ color: caso.color }} />
      </div>
      <div className="flex-1">
        <div style={{ color: caso.color, fontSize: '10px',
                      fontWeight: 500, marginBottom: 2,
                      textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Caso activo
        </div>
        <h4 style={{ color: tokens.textPrimary, fontSize: '13px',
                     fontWeight: 500, marginBottom: 4 }}>
          {caso.titulo}
        </h4>
        <p style={{ color: tokens.textSecondary, fontSize: '11px', lineHeight: 1.5 }}>
          {caso.sugerencia}
        </p>
      </div>
      <button onClick={() => onExplicar(caso)}
        className="py-1 px-2 rounded-md flex items-center gap-1 transition-all flex-shrink-0"
        style={{
          backgroundColor: tokens.accent, color: 'white',
          fontSize: '11px', fontWeight: 500,
        }}>
        <Sparkles size={11} /> Tour
      </button>
      <button onClick={onClose} style={{ color: tokens.textTertiary, flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  );
};

// ============================================================
// PANEL DE TEORÍA
// ============================================================
const PanelTeoria = ({ open, onClose }) => {
  const [openSection, setOpenSection] = useState('que-es');
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40"
             style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
             onClick={onClose} />
      )}
      <div className="fixed top-0 right-0 z-50 h-screen overflow-y-auto transition-transform"
        style={{
          width: '420px', maxWidth: '95vw',
          backgroundColor: tokens.surface,
          borderLeft: `1px solid ${tokens.border}`,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: open ? '-10px 0 30px rgba(0,0,0,0.4)' : 'none',
        }}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-4"
          style={{ backgroundColor: tokens.surface, borderBottom: `1px solid ${tokens.border}` }}>
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: tokens.accent }} />
            <h2 style={{ fontWeight: 500, fontSize: '14px' }}>Teoría rápida</h2>
          </div>
          <button onClick={onClose} style={{ color: tokens.textTertiary }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <p style={{ color: tokens.textSecondary, fontSize: '12px', lineHeight: 1.6, marginBottom: 12 }}>
            Todo lo que necesitas saber sobre la PUT, explicado desde cero.
          </p>
          {TEORIA.map((sec) => {
            const isOpen = openSection === sec.id;
            return (
              <div key={sec.id} className="mb-2 rounded-lg overflow-hidden"
                   style={{ border: `1px solid ${tokens.border}` }}>
                <button onClick={() => setOpenSection(isOpen ? null : sec.id)}
                  className="w-full flex items-center justify-between p-3 text-left"
                  style={{
                    backgroundColor: isOpen ? tokens.surfaceElevated : tokens.surface,
                    color: tokens.textPrimary,
                  }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 16 }}>{sec.icono}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{sec.titulo}</span>
                  </div>
                  <ChevronDown size={14}
                    style={{
                      color: tokens.textTertiary,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms',
                    }} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-2"
                       style={{
                         backgroundColor: tokens.surfaceElevated,
                         color: tokens.textPrimary, fontSize: '12px',
                         lineHeight: 1.6, borderTop: `1px solid ${tokens.border}`,
                       }}>
                    {sec.contenido}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ============================================================
// TOUR INTERACTIVO — Posicionamiento adaptativo móvil/desktop
// ============================================================
const CARD_H = 230;
const CARD_W_DESKTOP = 340;
const MARGIN = 12;

const TourCaso = ({ caso, step, total, onNext, onPrev, onClose, isFirst, isLast }) => {
  const [pos, setPos] = useState({ top: 0, left: 0, width: CARD_W_DESKTOP, visible: false });
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    setPos(p => ({ ...p, visible: false }));

    const target = document.getElementById(step.target);
    if (!target) {
      setTargetRect(null);
      setPos({ top: 80, left: 16, width: Math.min(CARD_W_DESKTOP, window.innerWidth - 32), visible: true });
      return;
    }

    const isMobile = window.innerWidth < 640;

    // En móvil: scroll para dejar el elemento en el tercio superior,
    // dejando espacio abajo para el tooltip.
    if (isMobile) {
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const desiredScrollTop = targetTop - 80; // 80px desde la parte superior
      window.scrollTo({ top: desiredScrollTop, behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (isMobile) {
        // Móvil: card ancho completo anclada SIEMPRE debajo del elemento.
        // Si no hay espacio abajo, va arriba.
        const cardW = vw - 32; // 16px margen a cada lado
        let top = rect.bottom + MARGIN;
        let left = 16;

        if (top + CARD_H > vh - 16) {
          // No cabe abajo → va arriba
          top = rect.top - CARD_H - MARGIN;
        }
        // Si tampoco cabe arriba (elemento muy grande), anclar al fondo de la pantalla
        if (top < 60) {
          top = vh - CARD_H - 16;
        }

        setPos({ top, left, width: cardW, visible: true });
      } else {
        // Desktop: lógica original mejorada
        const cardW = CARD_W_DESKTOP;
        let top, left;

        const spaceRight  = vw - rect.right - MARGIN;
        const spaceLeft   = rect.left - MARGIN;
        const spaceBottom = vh - rect.bottom - MARGIN;
        const spaceTop    = rect.top - MARGIN;

        if (step.pos === 'right' && spaceRight >= cardW) {
          left = rect.right + MARGIN;
          top  = rect.top + rect.height / 2 - CARD_H / 2;
        } else if (step.pos === 'left' && spaceLeft >= cardW) {
          left = rect.left - cardW - MARGIN;
          top  = rect.top + rect.height / 2 - CARD_H / 2;
        } else if (spaceBottom >= CARD_H) {
          // Preferencia: debajo si hay espacio
          top  = rect.bottom + MARGIN;
          left = rect.left + rect.width / 2 - cardW / 2;
        } else if (spaceTop >= CARD_H) {
          top  = rect.top - CARD_H - MARGIN;
          left = rect.left + rect.width / 2 - cardW / 2;
        } else if (spaceRight >= cardW) {
          left = rect.right + MARGIN;
          top  = rect.top + rect.height / 2 - CARD_H / 2;
        } else {
          left = rect.left - cardW - MARGIN;
          top  = rect.top + rect.height / 2 - CARD_H / 2;
        }

        top  = Math.max(16, Math.min(top,  vh - CARD_H - 16));
        left = Math.max(16, Math.min(left, vw - cardW  - 16));

        setPos({ top, left, width: cardW, visible: true });
      }
    }, 450);
  }, [step]);

  const Icono = caso.icono;

  return (
    <>
      {/* Overlay oscuro */}
      <div className="fixed inset-0 z-40 pointer-events-none"
           style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} />

      {/* Halo sobre el elemento resaltado */}
      {targetRect && (
        <div className="fixed z-40 pointer-events-none rounded-xl"
          style={{
            top:    targetRect.top    - 6,
            left:   targetRect.left   - 6,
            width:  targetRect.width  + 12,
            height: targetRect.height + 12,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 2px ${caso.color}, 0 0 24px ${caso.color}70`,
            transition: 'all 300ms',
          }} />
      )}

      {/* Tooltip del tour */}
      <div className="fixed z-50 rounded-xl p-4"
        style={{
          top:     pos.top,
          left:    pos.left,
          width:   pos.width,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: tokens.surface,
          border: `1px solid ${caso.color}`,
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          opacity: pos.visible ? 1 : 0,
          transition: 'opacity 200ms',
        }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icono size={12} style={{ color: caso.color }} />
            <span style={{
              color: caso.color, fontSize: '10px', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {caso.titulo} · {total.current}/{total.total}
            </span>
          </div>
          <button onClick={onClose} style={{ color: tokens.textTertiary }}>
            <X size={14} />
          </button>
        </div>
        <h3 style={{ color: tokens.textPrimary, fontSize: '14px', fontWeight: 500, marginBottom: 6 }}>
          {step.titulo}
        </h3>
        <p style={{ color: tokens.textSecondary, fontSize: '12px', lineHeight: 1.6, marginBottom: 12 }}>
          {step.texto}
        </p>
        <div className="flex justify-between items-center">
          <button onClick={onPrev} disabled={isFirst}
            className="flex items-center gap-1 px-2 py-1 rounded"
            style={{
              color: isFirst ? tokens.textTertiary : tokens.textSecondary,
              fontSize: '11px', opacity: isFirst ? 0.4 : 1,
            }}>
            <ArrowLeft size={11} /> Anterior
          </button>
          <button onClick={onNext}
            className="px-3 py-1.5 rounded-md flex items-center gap-1.5"
            style={{
              backgroundColor: caso.color, color: 'white',
              fontSize: '12px', fontWeight: 500,
            }}>
            {isLast ? 'Finalizar' : 'Siguiente'}
            {!isLast && <ArrowRight size={12} />}
          </button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// BIENVENIDA
// ============================================================
const Bienvenida = ({ onComenzar }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
       style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
    <div className="rounded-xl p-6 max-w-md w-full"
         style={{ backgroundColor: tokens.surface, border: `1px solid ${tokens.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap size={20} style={{ color: tokens.accent }} />
        <h3 style={{ fontWeight: 500, fontSize: '16px' }}>¡Bienvenido al simulador!</h3>
      </div>
      <p style={{ color: tokens.textSecondary, fontSize: '13px', lineHeight: 1.6, marginBottom: 16 }}>
        Vas a aprender qué es una <strong style={{ color: tokens.textPrimary }}>opción PUT</strong> de forma visual:
        mueves variables, ves cómo cambia un gráfico y un profesor virtual te explica qué está pasando.
      </p>
      <div style={{
        backgroundColor: tokens.surfaceElevated,
        border: `1px solid ${tokens.accent}30`, borderRadius: 8, padding: 12, marginBottom: 16,
      }}>
        <p style={{ color: tokens.textPrimary, fontSize: '12px', lineHeight: 1.6, marginBottom: 8 }}>
          <strong>Empieza por los 5 Casos Guiados</strong> en la parte superior. Cada uno te enseña un concepto financiero distinto con un escenario realista.
        </p>
        <p style={{ color: tokens.textTertiary, fontSize: '11px', lineHeight: 1.5 }}>
          Pulsa <strong style={{ color: tokens.accent }}>"Explícame"</strong> en cualquier caso para un tour guiado paso a paso.
        </p>
      </div>
      <button onClick={onComenzar}
        className="w-full py-2 rounded-lg flex items-center justify-center gap-2"
        style={{ backgroundColor: tokens.accent, color: 'white', fontWeight: 500, fontSize: '13px' }}>
        Comenzar <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

// ============================================================
// MODAL COMPARATIVA: COMPRA vs VENTA DE PUT
// ============================================================
const ModalComparativa = ({ open, onClose }) => {
  const [showFormula, setShowFormula] = useState(false);
  if (!open) return null;

  const conceptos = [
    {
      emoji: '💳',
      compra: 'Paga la prima P',
      venta: 'Cobra la prima P',
      colorCompra: tokens.loss,
      colorVenta: tokens.profit,
    },
    {
      emoji: '⚖️',
      compra: 'Tiene un DERECHO',
      venta: 'Asume una OBLIGACIÓN',
      colorCompra: tokens.profit,
      colorVenta: tokens.loss,
    },
    {
      emoji: '🎯',
      compra: 'Decide si ejerce',
      venta: 'Responde al comprador',
      colorCompra: tokens.profit,
      colorVenta: tokens.textSecondary,
    },
    {
      emoji: '📉',
      compra: 'Espera que S baje',
      venta: 'Espera que S suba o se mantenga',
      colorCompra: tokens.loss,
      colorVenta: tokens.profit,
    },
    {
      emoji: '🏆',
      compra: 'Gana si S cae mucho',
      venta: 'Gana si S no cae',
      colorCompra: tokens.profit,
      colorVenta: tokens.profit,
    },
    {
      emoji: '🛡️',
      compra: 'Pérdida máxima = P',
      venta: 'Pérdida max = E − P (si S = 0)',
      colorCompra: tokens.profit,
      colorVenta: tokens.loss,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto"
         style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
         onClick={onClose}>
      <div className="rounded-xl my-4 w-full max-w-2xl"
           onClick={(e) => e.stopPropagation()}
           style={{ backgroundColor: tokens.surface, border: `1px solid ${tokens.border}` }}>

        {/* Header */}
        <div className="flex items-center justify-between p-4"
             style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <div className="flex items-center gap-2">
            <Scale size={16} style={{ color: tokens.accent }} />
            <h2 style={{ fontWeight: 500, fontSize: '15px' }}>Compra PUT vs Venta PUT</h2>
          </div>
          <button onClick={onClose} style={{ color: tokens.textTertiary }}><X size={18} /></button>
        </div>

        {/* Hero cards */}
        <div className="grid grid-cols-2 gap-3 p-4 pb-3">
          {/* Comprador */}
          <div className="rounded-xl p-4"
               style={{ backgroundColor: `${tokens.profit}10`, border: `1px solid ${tokens.profit}30` }}>
            <div className="text-center mb-3">
              <div style={{ fontSize: 32, marginBottom: 6 }}>🧑</div>
              <div style={{ color: tokens.profit, fontWeight: 600, fontSize: '13px' }}>
                COMPRADOR
              </div>
              <div style={{ color: tokens.textTertiary, fontSize: '10px', marginTop: 2 }}>
                Long PUT · Posición larga
              </div>
            </div>
            <div className="text-center py-2 rounded-lg mb-3"
                 style={{ backgroundColor: `${tokens.profit}20` }}>
              <div style={{ color: tokens.textTertiary, fontSize: '10px', marginBottom: 2 }}>Analogía</div>
              <div style={{ color: tokens.textPrimary, fontSize: '11px', fontWeight: 500 }}>
                🏠 Compra el seguro
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs"
                   style={{ color: tokens.textSecondary }}>
                <span style={{ color: tokens.loss }}>↓</span> Estrategia <strong style={{ color: tokens.textPrimary }}>bajista</strong>
              </div>
              <div className="flex items-center gap-2 text-xs"
                   style={{ color: tokens.textSecondary }}>
                <span>📌</span> Gana si <strong style={{ color: tokens.textPrimary }}>S &lt; E − P</strong>
              </div>
              <div className="flex items-center gap-2 text-xs"
                   style={{ color: tokens.textSecondary }}>
                <span style={{ color: tokens.profit }}>✓</span> Pérdida limitada a <strong style={{ color: tokens.profit }}>P</strong>
              </div>
            </div>
          </div>

          {/* Vendedor */}
          <div className="rounded-xl p-4"
               style={{ backgroundColor: `${tokens.loss}10`, border: `1px solid ${tokens.loss}30` }}>
            <div className="text-center mb-3">
              <div style={{ fontSize: 32, marginBottom: 6 }}>🏦</div>
              <div style={{ color: tokens.loss, fontWeight: 600, fontSize: '13px' }}>
                VENDEDOR
              </div>
              <div style={{ color: tokens.textTertiary, fontSize: '10px', marginTop: 2 }}>
                Short PUT · Posición corta
              </div>
            </div>
            <div className="text-center py-2 rounded-lg mb-3"
                 style={{ backgroundColor: `${tokens.loss}20` }}>
              <div style={{ color: tokens.textTertiary, fontSize: '10px', marginBottom: 2 }}>Analogía</div>
              <div style={{ color: tokens.textPrimary, fontSize: '11px', fontWeight: 500 }}>
                🏦 Vende el seguro
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs"
                   style={{ color: tokens.textSecondary }}>
                <span style={{ color: tokens.profit }}>↑</span> Estrategia <strong style={{ color: tokens.textPrimary }}>alcista/neutral</strong>
              </div>
              <div className="flex items-center gap-2 text-xs"
                   style={{ color: tokens.textSecondary }}>
                <span>📌</span> Gana si <strong style={{ color: tokens.textPrimary }}>S &gt; E − P</strong>
              </div>
              <div className="flex items-center gap-2 text-xs"
                   style={{ color: tokens.textSecondary }}>
                <span style={{ color: tokens.loss }}>!</span> Pérdida casi ilimitada
              </div>
            </div>
          </div>
        </div>

        {/* Conceptos clave como pills */}
        <div className="px-4 pb-3">
          <div style={{ color: tokens.textTertiary, fontSize: '10px', fontWeight: 500,
                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Diferencias clave
          </div>
          <div className="space-y-2">
            {conceptos.map((c, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                {/* Compra */}
                <div className="col-span-5 flex justify-end">
                  <span className="px-2 py-1 rounded-md text-right"
                        style={{
                          backgroundColor: `${c.colorCompra}15`,
                          color: c.colorCompra,
                          fontSize: '11px', fontWeight: 500,
                          border: `1px solid ${c.colorCompra}30`,
                        }}>
                    {c.compra}
                  </span>
                </div>
                {/* Emoji central */}
                <div className="col-span-2 text-center" style={{ fontSize: 16 }}>{c.emoji}</div>
                {/* Venta */}
                <div className="col-span-5 flex justify-start">
                  <span className="px-2 py-1 rounded-md"
                        style={{
                          backgroundColor: `${c.colorVenta}15`,
                          color: c.colorVenta,
                          fontSize: '11px', fontWeight: 500,
                          border: `1px solid ${c.colorVenta}30`,
                        }}>
                    {c.venta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fórmulas colapsables */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowFormula(f => !f)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: tokens.surfaceElevated,
              border: `1px solid ${tokens.border}`,
              color: tokens.accent, fontSize: '12px', fontWeight: 500,
            }}>
            <span style={{ fontSize: 14 }}>🧮</span>
            {showFormula ? 'Ocultar fórmulas matemáticas' : 'Ver fórmulas matemáticas'}
            <ChevronDown size={13} style={{
              marginLeft: 'auto',
              transform: showFormula ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms',
            }} />
          </button>

          {showFormula && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3"
                   style={{ backgroundColor: `${tokens.profit}10`, border: `1px solid ${tokens.profit}30` }}>
                <div style={{ color: tokens.profit, fontSize: '10px', fontWeight: 500, marginBottom: 6 }}>
                  COMPRADOR — Long PUT
                </div>
                <div style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: '12px',
                  color: tokens.textPrimary, lineHeight: 1.8,
                }}>
                  <div>B/P = max(0, E − S) − P</div>
                  <div style={{ color: tokens.textTertiary, fontSize: '10px', marginTop: 4 }}>
                    BE = E − P<br/>
                    B/P máx = (E − P) × 100 × n<br/>
                    Pérdida máx = −P × 100 × n
                  </div>
                </div>
              </div>
              <div className="rounded-lg p-3"
                   style={{ backgroundColor: `${tokens.loss}10`, border: `1px solid ${tokens.loss}30` }}>
                <div style={{ color: tokens.loss, fontSize: '10px', fontWeight: 500, marginBottom: 6 }}>
                  VENDEDOR — Short PUT
                </div>
                <div style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: '12px',
                  color: tokens.textPrimary, lineHeight: 1.8,
                }}>
                  <div>B/P = P − max(0, E − S)</div>
                  <div style={{ color: tokens.textTertiary, fontSize: '10px', marginTop: 4 }}>
                    BE = E − P<br/>
                    B/P máx = +P × 100 × n<br/>
                    Pérdida máx = −(E − P) × 100 × n
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                     style={{ backgroundColor: `${tokens.accent}10`, border: `1px solid ${tokens.accent}25` }}>
                  <Lightbulb size={12} style={{ color: tokens.accent, marginTop: 2, flexShrink: 0 }} />
                  <p style={{ color: tokens.textPrimary, fontSize: '11px', lineHeight: 1.5 }}>
                    <strong>Juego de suma cero:</strong> los dos payoffs son reflejos especulares sobre el eje X.
                    Lo que gana uno lo pierde el otro. P y E son los mismos para ambos; solo cambia el signo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default function SimuladorPUT() {
  const [modo, setModo] = useState('especulativa');
  const [S0, setS0] = useState(100);
  const [K, setK] = useState(95);
  const [prima, setPrima] = useState(4);
  const [T, setT] = useState(90);
  const [contratos, setContratos] = useState(1);
  const [ST, setST] = useState(85);
  const [Tslider, setTslider] = useState(90);

  const [vistaActiva, setVistaActiva] = useState('grafico'); // 'grafico'|'analisis'|'temporal'
  const [panelAnalisisOpen, setPanelAnalisisOpen] = useState(true);
  const [showBienvenida, setShowBienvenida] = useState(true);
  const [showTeoria, setShowTeoria] = useState(false);
  const [showComparativa, setShowComparativa] = useState(false);
  const [casoActivo, setCasoActivo] = useState(null);

  // Tour state
  const [tourActive, setTourActive] = useState(false);
  const [tourCaso, setTourCaso] = useState(null);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const minST = 0.5 * K, maxST = 1.5 * K;
    if (ST < minST) setST(minST);
    if (ST > maxST) setST(maxST);
  }, [K]);

  // Cargar caso con animación
  const cargarCaso = useCallback((caso) => {
    const v = caso.valores;
    setModo(caso.modo);

    // Animación suave de los valores (interpolación en 600ms)
    const start = { S0, K, prima, T, contratos, ST, Tslider };
    const end = v;
    const duration = 600;
    const t0 = performance.now();

    const animate = (now) => {
      const elapsed = now - t0;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      setS0(start.S0 + (end.S0 - start.S0) * eased);
      setK(start.K + (end.K - start.K) * eased);
      setPrima(start.prima + (end.prima - start.prima) * eased);
      setT(start.T + (end.T - start.T) * eased);
      setContratos(Math.round(start.contratos + (end.contratos - start.contratos) * eased));
      setST(start.ST + (end.ST - start.ST) * eased);
      setTslider(start.Tslider + (end.Tslider - start.Tslider) * eased);

      if (t < 1) requestAnimationFrame(animate);
      else {
        setS0(end.S0); setK(end.K); setPrima(end.prima); setT(end.T);
        setContratos(end.contratos); setST(end.ST); setTslider(end.Tslider);
      }
    };
    requestAnimationFrame(animate);

    setCasoActivo(caso);

    // Scroll suave al banner/simulador
    setTimeout(() => {
      const el = document.getElementById('banner-caso');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 700);
  }, [S0, K, prima, T, contratos, ST, Tslider]);

  const explicarCaso = useCallback((caso) => {
    // Si el caso no está cargado, cargarlo primero
    if (!casoActivo || casoActivo.id !== caso.id) {
      cargarCaso(caso);
      setTimeout(() => {
        setTourCaso(caso);
        setTourStep(0);
        setTourActive(true);
      }, 800);
    } else {
      setTourCaso(caso);
      setTourStep(0);
      setTourActive(true);
    }
  }, [casoActivo, cargarCaso]);

  const nextTour = () => {
    if (tourStep < tourCaso.tour.length - 1) {
      const nextStep = tourCaso.tour[tourStep + 1];
      // Ejecutar acción si el siguiente paso lo requiere
      if (nextStep.accion) {
        const { setter, valor } = nextStep.accion;
        if (setter === 'setST') setST(valor);
      }
      setTourStep(tourStep + 1);
    } else {
      setTourActive(false);
    }
  };
  const prevTour = () => { if (tourStep > 0) setTourStep(tourStep - 1); };
  const closeTour = () => setTourActive(false);

  const breakEven = useMemo(() => K - prima, [K, prima]);
  const costePrima = useMemo(() => prima * 100 * contratos, [prima, contratos]);
  const perdidaMaxEspeculativa = useMemo(() => -costePrima, [costePrima]);
  const beneficioMaxEspeculativo = useMemo(() => (K * 100 * contratos) - costePrima, [K, contratos, costePrima]);
  // Métricas modo VENTA
  const beneficioMaxVenta = useMemo(() => costePrima, [costePrima]); // = +P por contrato
  const perdidaMaxVenta = useMemo(() => -(K * 100 * contratos) + costePrima, [K, contratos, costePrima]); // si S=0

  const plActual = useMemo(() => {
    if (modo === 'venta') return shortPutPL(K, ST, prima, contratos);
    return longPutPL(K, ST, prima, contratos);
  }, [modo, K, ST, prima, contratos]);

  const payoffData = useMemo(() => {
    const data = [];
    const xMin = K * 0.5, xMax = K * 1.5, steps = 100;
    for (let i = 0; i <= steps; i++) {
      const s = xMin + (xMax - xMin) * (i / steps);
      // B/P compra: max(0, E-S) - P   |   B/P venta: P - max(0, E-S)
      data.push({
        S: parseFloat(s.toFixed(2)),
        pl: modo === 'venta'
          ? shortPutPL(K, s, prima, contratos)
          : longPutPL(K, s, prima, contratos),
      });
    }
    return data;
  }, [modo, K, prima, contratos]);

  // Dominio Y limpio: siempre incluye el 0
  const yDomain = useMemo(() => {
    const vals = payoffData.map(d => d.pl ?? 0).filter(v => isFinite(v));
    if (!vals.length) return ['auto', 'auto'];
    const rawMin = Math.min(0, ...vals);
    const rawMax = Math.max(0, ...vals);
    const span   = Math.max(Math.abs(rawMax - rawMin), 1);
    const pad    = span * 0.18;
    return [parseFloat((rawMin - pad).toFixed(1)), parseFloat((rawMax + pad).toFixed(1))];
  }, [payoffData]);

  const valorData = useMemo(() => {
    const data = [];
    const min = 0.6 * K, max = 1.4 * K, steps = 60;
    for (let i = 0; i <= steps; i++) {
      const s = min + (max - min) * (i / steps);
      const intrinseco = Math.max(0, K - s);
      const temporal = valorTemporal(s, K, Tslider);
      data.push({ S: s, intrinseco, total: intrinseco + temporal });
    }
    return data;
  }, [K, Tslider]);

  const tablaEscenarios = useMemo(() => {
    const min = 0.6 * K, max = 1.4 * K;
    const filas = [];
    for (let i = 0; i < 7; i++) {
      const s = min + (max - min) * (i / 6);
      const vi = Math.max(0, K - s);
      // B/P según posición: compra o venta
      const plPut = modo === 'venta'
        ? shortPutPL(K, s, prima, contratos)
        : longPutPL(K, s, prima, contratos);
      filas.push({
        ST: s, vi, prima: costePrima, plPut,
        estado:   estadoOpcion(K, s),
        ejercita: seEjercita(K, s),
      });
    }
    return filas;
  }, [K, prima, contratos, modo, costePrima]);

  const interpretacion = useMemo(() => interpretar({ modo, K, ST, prima }), [modo, K, ST, prima]);

  const reset = useCallback(() => {
    setS0(100); setK(95); setPrima(4); setT(90); setContratos(1);
    setST(85); setTslider(90);
    setCasoActivo(null);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6"
         style={{ backgroundColor: tokens.bg, color: tokens.textPrimary,
                  fontFamily: 'Inter, system-ui, sans-serif' }}>

      {showBienvenida && <Bienvenida onComenzar={() => setShowBienvenida(false)} />}
      {tourActive && tourCaso && (
        <TourCaso
          caso={tourCaso}
          step={tourCaso.tour[tourStep]}
          total={{ current: tourStep + 1, total: tourCaso.tour.length }}
          onNext={nextTour}
          onPrev={prevTour}
          onClose={closeTour}
          isFirst={tourStep === 0}
          isLast={tourStep === tourCaso.tour.length - 1}
        />
      )}
      <PanelTeoria open={showTeoria} onClose={() => setShowTeoria(false)} />
      <ModalComparativa open={showComparativa} onClose={() => setShowComparativa(false)} />

      <div className="max-w-7xl mx-auto">
        {/* CABECERA */}
        <div className="mb-5">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5"
                   style={{ color: tokens.textTertiary, fontSize: '11px' }}>
                <span>Derivados</span>
                <ChevronRight size={10} />
                <span>Opciones</span>
                <ChevronRight size={10} />
                <span style={{ color: tokens.textSecondary }}>Simulador PUT</span>
              </div>
              <h1 style={{ fontWeight: 500, letterSpacing: '-0.02em',
                           fontSize: '22px', marginBottom: 4 }}>
                Simulador de opción PUT
              </h1>
              <p style={{ color: tokens.textSecondary, fontSize: '13px' }}>
                Aprende qué es una PUT moviendo variables y viendo qué pasa.
              </p>
            </div>
            <button onClick={() => setShowTeoria(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: tokens.surface,
                border: `1px solid ${tokens.accent}40`,
                color: tokens.textPrimary, fontSize: '12px', fontWeight: 500,
              }}>
              <BookOpen size={14} style={{ color: tokens.accent }} />
              Teoría
            </button>
          </div>
        </div>

        {/* CASOS GUIADOS */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: tokens.accent }} />
              <h2 style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                Casos guiados
              </h2>
              <span style={{
                color: tokens.textTertiary, fontSize: '11px',
                backgroundColor: tokens.surface,
                padding: '2px 6px', borderRadius: 4,
                border: `1px solid ${tokens.border}`,
              }}>
                {CASOS.filter(c => c.modo === modo).length} escenarios
              </span>
            </div>
            <p style={{ color: tokens.textTertiary, fontSize: '11px' }}>
              Empieza aquí ↓
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2"
               style={{ scrollbarWidth: 'thin' }}>
            {CASOS.filter(c => c.modo === modo).map((caso) => (
              <CasoCard key={caso.id} caso={caso}
                isActive={casoActivo?.id === caso.id}
                onCargar={cargarCaso}
                onExplicar={explicarCaso} />
            ))}
          </div>
        </div>

        {/* BANNER DE CASO ACTIVO */}
        <div id="banner-caso">
          {casoActivo && (
            <BannerCaso caso={casoActivo}
              onClose={() => setCasoActivo(null)}
              onExplicar={explicarCaso} />
          )}
        </div>

        {/* TABS DE MODO + BOTÓN COMPARAR */}
        <div className="flex items-center justify-between gap-2 mb-4 border-b flex-wrap"
             style={{ borderColor: tokens.border }}>
          <div className="flex gap-1 flex-wrap">
            <Tab active={modo === 'especulativa'} onClick={() => { setModo('especulativa'); setCasoActivo(null); setVistaActiva('grafico'); }}>
              <TrendingDown size={12} className="inline mr-1" style={{ verticalAlign: '-2px' }} />
              Compra PUT
            </Tab>

            <Tab active={modo === 'venta'} onClick={() => { setModo('venta'); setCasoActivo(null); setVistaActiva('grafico'); }}>
              <TrendingUp size={12} className="inline mr-1" style={{ verticalAlign: '-2px' }} />
              Venta de PUT
            </Tab>
          </div>
          <button onClick={() => setShowComparativa(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 mb-1 rounded-md"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${tokens.accent}40`,
              color: tokens.accent, fontSize: '11px', fontWeight: 500,
            }}>
            <Scale size={11} /> Comparar
          </button>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          <div className="lg:col-span-4 space-y-3">
            <Card id="panel-variables">
              <div className="flex justify-between items-center mb-3">
                <h2 style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px' }}>Variables</h2>
                <button onClick={reset} className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                  style={{ color: tokens.textTertiary, fontSize: '11px' }}>
                  <RotateCcw size={10} /> Reset
                </button>
              </div>

              <LabeledSlider label="Precio del subyacente (S₀)" value={Math.round(S0 * 10) / 10}
                onChange={setS0} min={10} max={500} tooltip={TOOLTIPS.S0} />
              <LabeledSlider label="Precio de ejercicio (E)" value={Math.round(K * 10) / 10}
                onChange={setK} min={10} max={500} tooltip={TOOLTIPS.K} />
              <LabeledSlider label="Prima (P)" value={Math.round(prima * 10) / 10}
                onChange={setPrima} min={0.1} max={50} step={0.1} tooltip={TOOLTIPS.prima} />
              <LabeledSlider label="Días al vencimiento" value={Math.round(T)}
                onChange={setT} min={1} max={365} unit="d" tooltip={TOOLTIPS.T} />
              <LabeledSlider label="Contratos" value={Math.round(contratos)}
                onChange={setContratos} min={1} max={100} unit="" tooltip={TOOLTIPS.contratos} />


            </Card>

            <Card id="panel-explorar">
              <h2 style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px', marginBottom: 8 }}>
                Explorar escenario
              </h2>
              <LabeledSlider label="Precio al vencimiento (S_T)" value={Math.round(ST * 10) / 10}
                onChange={setST}
                min={Math.round(0.5 * K)} max={Math.round(1.5 * K)} step={0.5}
                tooltip={TOOLTIPS.ST} accent />
              <div className="mt-2 pt-2 border-t" style={{ borderColor: tokens.border }}>
                <div className="flex justify-between items-baseline">
                  <span style={{ color: tokens.textSecondary, fontSize: '11px' }}>P/L en este escenario</span>
                  <span style={{
                    color: plActual >= 0 ? tokens.profit : tokens.loss,
                    fontFamily: 'ui-monospace, monospace', fontWeight: 500, fontSize: '16px',
                  }}>
                    {plActual >= 0 ? '+' : ''}{fmtEUR(plActual)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-3">

            {/* ── TABS INTERNOS DE VISUALIZACIÓN ── */}
            <div style={{
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {/* Sub-tabs */}
              <div className="flex items-center gap-0 border-b px-4"
                   style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceElevated }}>
                {[
                  { id: 'grafico',  label: 'Gráfico',           emoji: '📈' },
                  { id: 'analisis', label: 'Escenarios',         emoji: '📊' },
                  { id: 'temporal', label: 'Valor temporal',     emoji: '⏱' },
                ].map(tab => (
                  <button key={tab.id}
                    onClick={() => setVistaActiva(tab.id)}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs transition-all"
                    style={{
                      color: vistaActiva === tab.id ? tokens.textPrimary : tokens.textTertiary,
                      borderBottom: `2px solid ${vistaActiva === tab.id ? tokens.accent : 'transparent'}`,
                      backgroundColor: 'transparent',
                      fontWeight: vistaActiva === tab.id ? 500 : 400,
                    }}>
                    <span style={{ fontSize: 13 }}>{tab.emoji}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── VISTA: GRÁFICO ── */}
              {vistaActiva === 'grafico' && (
                <div id="grafico-payoff" className="p-5">
                  <div className="mb-3">
                    <h2 style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                      Payoff al vencimiento
                    </h2>
                    <p style={{ color: tokens.textTertiary, fontSize: '11px', marginTop: 2 }}>
                      {modo === 'venta'
                        ? 'B/P = P − max(0, E − S_T). Beneficio acotado arriba, pérdida creciente hacia abajo.'
                        : 'B/P = max(0, E − S_T) − P. Pérdida limitada a la prima, beneficio crece al caer S.'}
                    </p>
                  </div>

                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={payoffData} margin={{ top: 28, right: 16, left: 4, bottom: 8 }}>
                        <CartesianGrid stroke={tokens.border} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="S" type="number" domain={[K * 0.5, K * 1.5]}
                          tick={{ fill: tokens.textTertiary, fontSize: 10, fontFamily: 'ui-monospace' }}
                          stroke={tokens.border} tickCount={6}
                          tickFormatter={(v) => `${fmtNum(v, 0)}€`} />
                        <YAxis domain={yDomain}
                          tick={{ fill: tokens.textTertiary, fontSize: 10, fontFamily: 'ui-monospace' }}
                          stroke={tokens.border} width={58}
                          tickFormatter={(v) => {
                            const abs = Math.abs(v);
                            if (abs >= 1000) return `${v < 0 ? '-' : ''}${fmtNum(abs / 1000, 1)}k€`;
                            return `${fmtNum(v, 0)}€`;
                          }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: tokens.surfaceElevated,
                            border: `1px solid ${tokens.borderHover}`,
                            borderRadius: 8, fontSize: 11,
                          }}
                          labelStyle={{ color: tokens.textSecondary }}
                          formatter={(v, name) => [fmtEUR(v), name]}
                          labelFormatter={(v) => `S_T = ${fmtNum(v, 0)}€`} />
                        <ReferenceLine y={0} stroke={tokens.textSecondary} strokeWidth={1} />
                        <ReferenceLine x={K} stroke={tokens.strike} strokeWidth={2}
                          label={{ value: `E = ${fmtNum(K, 0)}€`, position: 'top',
                                   style: { fill: tokens.strike, fontSize: 10,
                                            fontFamily: 'ui-monospace', fontWeight: 600 } }} />
                        {breakEven >= K * 0.5 && breakEven <= K * 1.5 && (
                          <ReferenceLine x={breakEven} stroke={tokens.textSecondary}
                            strokeWidth={1} strokeDasharray="5 4"
                            label={{ value: `BE ${fmtNum(breakEven, 0)}€`, position: 'insideTopLeft',
                                     style: { fill: tokens.textSecondary, fontSize: 10,
                                              fontFamily: 'ui-monospace' } }} />
                        )}
                        <ReferenceLine x={ST} stroke={tokens.accent} strokeWidth={1.5} strokeDasharray="3 3" />
                        {(
                          <Line type="monotone" dataKey="pl" name="B/P total"
                                stroke={modo === 'venta' ? tokens.loss : tokens.profit}
                                strokeWidth={3} dot={false} isAnimationActive={false} />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Leyenda compacta */}
                  <div className="flex items-center gap-4 mt-2 flex-wrap"
                       style={{ fontSize: '10px', color: tokens.textSecondary }}>
                    {(modo === 'especulativa' || modo === 'venta') && (
                      <span className="flex items-center gap-1.5">
                        <span style={{ width: 16, height: 3, borderRadius: 2,
                                       backgroundColor: modo === 'venta' ? tokens.loss : tokens.profit }} />
                        {modo === 'venta' ? 'B/P venta PUT (€)' : 'B/P compra PUT (€)'}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span style={{ width: 16, height: 2, backgroundColor: tokens.strike }} />
                      Precio ejercicio (E)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span style={{ width: 16, height: 1, backgroundColor: tokens.textSecondary,
                                     borderTop: '1px dashed' }} />
                      Break-even
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span style={{ width: 16, height: 1, backgroundColor: tokens.accent,
                                     borderTop: '1px dashed' }} />
                      Tu escenario (S_T)
                    </span>
                  </div>

                  <ConceptoClave>
                    {modo === 'especulativa' && (
                      <>La <strong>forma de "L" invertida</strong>: pérdida fija = P a la derecha de E. A la izquierda, B/P = max(0, E − S_T) − P crece al caer S.</>
                    )}
                    {modo === 'venta' && (
                      <>Curva <strong>espejo de la compra</strong>: arriba acotada en +P (beneficio máximo), a la izquierda de E cae sin suelo. Vender PUT es asumir el riesgo a cambio de cobrar la prima.</>
                    )}
                  </ConceptoClave>
                </div>
              )}

              {/* ── VISTA: TABLA DE ESCENARIOS ── */}
              {vistaActiva === 'analisis' && (
                <div id="tabla-escenarios" className="p-5">
                  <h2 style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px', marginBottom: 8 }}>
                    Tabla de escenarios
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ color: tokens.textTertiary, borderBottom: `1px solid ${tokens.border}` }}>
                          <th className="text-right py-1.5 px-1.5" style={{ fontWeight: 400 }}>S_T</th>
                          <th className="text-right py-1.5 px-1.5" style={{ fontWeight: 400 }}>V. intrín.</th>
                          <th className="text-right py-1.5 px-1.5" style={{ fontWeight: 400 }}>Prima</th>
                          <th className="text-right py-1.5 px-1.5" style={{ fontWeight: 400 }}>
                            {modo === 'venta' ? 'B/P venta' : 'B/P PUT'}
                          </th>
                          <th className="text-right py-1.5 px-1.5" style={{ fontWeight: 400 }}>B/P total</th>
                          <th className="text-center py-1.5 px-1.5" style={{ fontWeight: 400 }}>Estado</th>
                          <th className="text-center py-1.5 px-1.5" style={{ fontWeight: 400 }}>
                            {modo === 'venta' ? '¿Te asignan?' : '¿Ejerces?'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tablaEscenarios.map((fila, idx) => {
                          const stepSize = (1.4 * K - 0.6 * K) / 6;
                          const isCurrent = Math.abs(fila.ST - ST) < stepSize / 2;
                          const primaSign  = modo === 'venta' ? '+' : '−';
                          const primaColor = modo === 'venta' ? tokens.profit : tokens.loss;
                          return (
                            <tr key={idx} style={{
                              borderBottom: `1px solid ${tokens.border}`,
                              backgroundColor: isCurrent ? `${tokens.accent}12` : 'transparent',
                            }}>
                              <td className="text-right py-1.5 px-1.5" style={{ color: tokens.textPrimary }}>
                                {fmtEUR(fila.ST)}
                              </td>
                              <td className="text-right py-1.5 px-1.5" style={{ color: tokens.textSecondary }}>
                                {fmtEUR(fila.vi)}
                              </td>
                              <td className="text-right py-1.5 px-1.5" style={{ color: primaColor }}>
                                {primaSign}{fmtEUR(fila.prima)}
                              </td>
                              <td className="text-right py-1.5 px-1.5"
                                  style={{ color: fila.plPut >= 0 ? tokens.profit : tokens.loss }}>
                                {fila.plPut >= 0 ? '+' : ''}{fmtEUR(fila.plPut)}
                              </td>
                              <td className="text-right py-1.5 px-1.5"
                                  style={{ color: fila.plPut >= 0 ? tokens.profit : tokens.loss, fontWeight: 500 }}>
                                {fila.plPut >= 0 ? '+' : ''}{fmtEUR(fila.plPut)}
                              </td>
                              <td className="text-center py-1.5 px-1.5">
                                <span className="px-1.5 py-0.5 rounded" style={{
                                  fontSize: '10px',
                                  backgroundColor:
                                    fila.estado === 'ITM' ? `${tokens.profit}20` :
                                    fila.estado === 'OTM' ? `${tokens.loss}20` :
                                    `${tokens.strike}20`,
                                  color:
                                    fila.estado === 'ITM' ? tokens.profit :
                                    fila.estado === 'OTM' ? tokens.loss :
                                    tokens.strike,
                                }}>
                                  {fila.estado}
                                </span>
                              </td>
                              <td className="text-center py-1.5 px-1.5">
                                <span className="px-1.5 py-0.5 rounded" style={{
                                  fontSize: '10px',
                                  backgroundColor:
                                    fila.ejercita === 'si'  ? `${tokens.profit}20` :
                                    fila.ejercita === 'no'  ? `${tokens.loss}20` :
                                                              `${tokens.strike}20`,
                                  color:
                                    fila.ejercita === 'si'  ? tokens.profit :
                                    fila.ejercita === 'no'  ? tokens.loss :
                                                              tokens.strike,
                                }}>
                                  {fila.ejercita === 'si' ? 'Sí' :
                                   fila.ejercita === 'no' ? 'No' : 'Indif.'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <ConceptoClave>
                    {modo === 'venta'
                      ? <>Como vendedor, <strong>no decides tú</strong>: respondes al comprador. La columna "¿Te asignan?" muestra cuándo ejerce (sí = S_T &lt; E).</>
                      : <>Lee de arriba abajo: <strong>cuanto más cae S, mejor para la PUT comprada</strong>. La fila azul es tu escenario actual.</>}
                  </ConceptoClave>
                </div>
              )}

              {/* ── VISTA: VALOR TEMPORAL ── */}
              {vistaActiva === 'temporal' && (
                <div id="grafico-valor" className="p-5">
                  <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                    <div>
                      <h2 style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                        Valor de la opción antes del vencimiento
                      </h2>
                      <p style={{ color: tokens.textTertiary, fontSize: '11px', marginTop: 2 }}>
                        Cómo cambia el valor de la PUT con el tiempo restante.
                      </p>
                    </div>
                    <div id="slider-tiempo" className="flex items-center gap-2" style={{ minWidth: 180 }}>
                      <label style={{ color: tokens.textSecondary, fontSize: '11px', whiteSpace: 'nowrap' }}>
                        Tiempo
                      </label>
                      <input type="range" min={1} max={365} value={Tslider}
                        onChange={(e) => setTslider(parseFloat(e.target.value))}
                        className="flex-1" style={{ accentColor: tokens.accent }} />
                      <span style={{ color: tokens.textPrimary, fontFamily: 'ui-monospace',
                                     fontSize: '11px', width: 32, textAlign: 'right' }}>
                        {Math.round(Tslider)}d
                      </span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <LineChart data={valorData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                        <CartesianGrid stroke={tokens.border} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="S" type="number" domain={[0.6 * K, 1.4 * K]}
                          tick={{ fill: tokens.textTertiary, fontSize: 10, fontFamily: 'ui-monospace' }}
                          stroke={tokens.border}
                          tickFormatter={(v) => `${fmtNum(v, 0)}€`} />
                        <YAxis
                          tick={{ fill: tokens.textTertiary, fontSize: 10, fontFamily: 'ui-monospace' }}
                          stroke={tokens.border}
                          tickFormatter={(v) => `${fmtNum(v, 0)}€`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: tokens.surfaceElevated,
                            border: `1px solid ${tokens.borderHover}`,
                            borderRadius: 8, fontSize: 11,
                          }}
                          formatter={(v, name) => [fmtEUR(v), name]}
                          labelFormatter={(v) => `S = ${fmtEUR(v)}`} />
                        <ReferenceLine x={K} stroke={tokens.strike} strokeWidth={1} strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="intrinseco" name="Valor intrínseco"
                              stroke={tokens.textSecondary} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                        <Line type="monotone" dataKey="total" name="Valor total"
                              stroke={tokens.accent} strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1" style={{ color: tokens.textSecondary, fontSize: '10px' }}>
                    <span className="flex items-center gap-1.5">
                      <span style={{ width: 12, height: 1.5, backgroundColor: tokens.textSecondary }} />
                      Valor intrínseco max(0, E − S)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span style={{ width: 12, height: 2, backgroundColor: tokens.accent }} />
                      Valor total aproximado
                    </span>
                  </div>
                  <ConceptoClave>
                    <strong>Mueve el slider "Tiempo"</strong> de 365 a 1 días. La curva azul se aplasta hasta tocar la gris. Eso es el valor temporal desapareciendo al acercarse el vencimiento.
                  </ConceptoClave>
                </div>
              )}
            </div>

            {/* ── PANEL COLAPSABLE: INTERPRETACIÓN + MÉTRICAS ── */}
            <div style={{
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setPanelAnalisisOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3"
                style={{ backgroundColor: tokens.surfaceElevated }}>
                <div className="flex items-center gap-2">
                  <Lightbulb size={13} style={{ color: tokens.accent }} />
                  <span style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px' }}>
                    Interpretación y métricas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: tokens.textTertiary, fontSize: '10px' }}>
                    {panelAnalisisOpen ? 'Colapsar' : 'Expandir'}
                  </span>
                  <ChevronDown size={14}
                    style={{
                      color: tokens.textTertiary,
                      transform: panelAnalisisOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms',
                    }} />
                </div>
              </button>

              {panelAnalisisOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div id="panel-interpretacion" className="p-5"
                       style={{ borderRight: `1px solid ${tokens.border}` }}>
                    <h2 style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px', marginBottom: 8 }}>
                      Interpretación financiera
                    </h2>
                    <div className="space-y-2.5">
                      {interpretacion.map((b, i) => (
                        <div key={i} className="pl-2.5 border-l-2"
                             style={{
                               borderColor:
                                 b.tono === 'profit' ? tokens.profit :
                                 b.tono === 'loss' ? tokens.loss :
                                 b.tono === 'warning' ? tokens.strike :
                                 tokens.textTertiary,
                               color: tokens.textPrimary, lineHeight: 1.6, fontSize: '12px',
                             }}>
                          <div style={{ color: tokens.textTertiary, fontWeight: 500, fontSize: '10px', marginBottom: 4 }}>
                            {b.titulo}
                          </div>
                          <span dangerouslySetInnerHTML={{
                            __html: b.texto.replace(/\*\*(.*?)\*\*/g,
                              '<strong style="font-weight:500; color:' + tokens.textPrimary + '">$1</strong>'),
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div id="metricas" className="p-5">
                    <h2 style={{ color: tokens.textPrimary, fontWeight: 500, fontSize: '13px', marginBottom: 8 }}>
                      Métricas clave
                    </h2>
                    {modo === 'especulativa' && (
                      <>
                        <MetricRow label="Pérdida máxima" value={fmtEUR(perdidaMaxEspeculativa)} color={tokens.loss} />
                        <MetricRow label="Beneficio máximo" value={fmtEUR(beneficioMaxEspeculativo)} color={tokens.profit} />
                        <MetricRow label="Break-even (E − P)" value={fmtEUR(breakEven)} color={tokens.strike} />
                        <MetricRow label="Coste total prima" value={fmtEUR(costePrima)} />
                        <MetricRow label="Apalancamiento" value={`${fmtNum(K / prima, 0)}×`} />
                        <div className="mt-2 pt-2 border-t"
                             style={{ borderColor: tokens.border, color: tokens.textTertiary, lineHeight: 1.5, fontSize: '10px' }}>
                          1 contrato controla 100 acciones por {fmtEUR(prima * 100)} de inversión.
                        </div>
                      </>
                    )}
                    {modo === 'venta' && (
                      <>
                        <MetricRow label="Beneficio máximo (= +P)" value={`+${fmtEUR(beneficioMaxVenta)}`} color={tokens.profit} />
                        <MetricRow label="Pérdida máxima (si S=0)" value={fmtEUR(perdidaMaxVenta)} color={tokens.loss} />
                        <MetricRow label="Break-even (E − P)" value={fmtEUR(breakEven)} color={tokens.strike} />
                        <MetricRow label="Prima cobrada" value={`+${fmtEUR(costePrima)}`} color={tokens.profit} />
                        <MetricRow label="Ratio riesgo/beneficio"
                                   value={`${fmtNum(Math.abs(perdidaMaxVenta) / Math.max(beneficioMaxVenta, 0.01), 1)} : 1`} />
                        <div className="mt-2 pt-2 border-t"
                             style={{ borderColor: tokens.border, color: tokens.textTertiary, lineHeight: 1.5, fontSize: '10px' }}>
                          Cobras la prima por adelantado, pero asumes obligación si S cae por debajo de E.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
