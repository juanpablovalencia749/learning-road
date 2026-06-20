export const preguntas = {
  legislacion: [
    {
      q: '¿Qué decreto compila las normas del Sistema de Gestión de SST en Colombia?',
      opts: ['Ley 100 de 1993', 'Decreto 1072 de 2015', 'Ley 1562 de 2012', 'Código Sustantivo del Trabajo'],
      answer: 1,
    },
    {
      q: '¿Quién es el principal responsable de la SST en una empresa?',
      opts: ['El supervisor', 'El empleador', 'El comité de SST', 'El trabajador'],
      answer: 1,
    },
    {
      q: '¿Cada cuánto debe realizarse la capacitación en SST?',
      opts: ['Una vez al año', 'Cada 2 años', 'Según la matriz de riesgos', 'No es obligatorio'],
      answer: 2,
    },
    {
      q: '¿Qué organismo vigila el cumplimiento de la SST en Colombia?',
      opts: ['EPS', 'Ministerio de Trabajo', 'ARL', 'Superintendencia de Salud'],
      answer: 1,
    },
    {
      q: '¿Qué documento deben firmar los trabajadores al recibir EPP?',
      opts: ['Contrato laboral', 'Registro de entrega de EPP', 'Acta de inducción', 'Formato de afiliación'],
      answer: 1,
    },
  ],

  ergonomia: [
    {
      q: '¿Cuál es el ángulo correcto del codo al usar el teclado?',
      opts: ['180° (recto)', '90°', '45°', 'Cualquier ángulo es válido'],
      answer: 1,
    },
    {
      q: '¿Cada cuánto se recomienda hacer una pausa activa?',
      opts: ['Cada 4 horas', 'Cada 1 o 2 horas', 'Solo al final del día', 'No son necesarias'],
      answer: 1,
    },
    {
      q: '¿Qué altura debe tener la silla respecto al escritorio?',
      opts: ['Más alta que el escritorio', 'Los brazos deben formar 90°', 'Los pies deben colgar', 'Queda a gusto del usuario'],
      answer: 1,
    },
    {
      q: '¿Qué es una lesión por esfuerzo repetitivo (LER)?',
      opts: ['Una lesión por caída', 'Daño por movimientos repetitivos', 'Una fractura', 'Una quemadura'],
      answer: 1,
    },
    {
      q: '¿Cuál es la postura correcta al sentarse frente al computador?',
      opts: ['Espalda recta, pies apoyados, pantalla a la altura de los ojos',
             'Inclinado hacia adelante',
             'Con las piernas cruzadas',
             'Mirando hacia abajo'],
      answer: 0,
    },
  ],

  'orden-limpieza': [
    {
      q: '¿Qué método se usa para mantener el orden en el área de trabajo?',
      opts: ['Método Kaizen', 'Método 5S', 'Método PDCA', 'Método PHVA'],
      answer: 1,
    },
    {
      q: '¿Cuál es el primer paso del método 5S?',
      opts: ['Estandarizar', 'Clasificar', 'Disciplinar', 'Limpiar'],
      answer: 1,
    },
    {
      q: '¿Qué debe hacerse con los derrames de líquidos en el piso?',
      opts: ['Esperar que se sequen solos', 'Limpiar inmediatamente y señalizar', 'Cubrir con una alfombra', 'Ignorar si es agua'],
      answer: 1,
    },
    {
      q: '¿Dónde deben almacenarse los materiales inflamables?',
      opts: ['En cualquier estante', 'En un gabinete ventilado y señalizado', 'Cerca de fuentes de calor', 'En el pasillo'],
      answer: 1,
    },
    {
      q: '¿Cada cuánto debe realizarse la limpieza profunda del área?',
      opts: ['Una vez al mes', 'Según el programa de limpieza de la empresa', 'Solo al final del año', 'Nunca'],
      answer: 1,
    },
  ],

  'primeros-auxilios': [
    {
      q: '¿Cuál es el número de compresiones por ciclo de RCP en adultos?',
      opts: ['15 compresiones', '30 compresiones', '50 compresiones', '10 compresiones'],
      answer: 1,
    },
    {
      q: '¿Qué hacer ante una obstrucción leve de la vía aérea?',
      opts: ['Dar golpes en la espalda', 'Animar a la persona a toser', 'Realizar maniobra de Heimlich', 'Llamar a emergencias'],
      answer: 1,
    },
    {
      q: '¿Cuál es la posición correcta para una persona inconsciente que respira?',
      opts: ['Boca arriba', 'Posición lateral de seguridad', 'Sentado', 'Boca abajo'],
      answer: 1,
    },
    {
      q: '¿Qué hacer ante una quemadura térmica leve?',
      opts: ['Aplicar hielo directo', 'Enfriar con agua corriente 10-15 min', 'Aplicar pasta de dientes', 'Romper las ampollas'],
      answer: 1,
    },
    {
      q: '¿Cuándo se debe llamar a emergencias?',
      opts: ['Solo si hay sangrado', 'Ante cualquier emergencia que supere los recursos disponibles',
             'Cuando el jefe lo autorice', 'Nunca, es pérdida de tiempo'],
      answer: 1,
    },
  ],

  'riesgos-electricos': [
    {
      q: '¿Qué significa LOTO en seguridad eléctrica?',
      opts: ['Lock Out - Tag Out', 'Low Tension Operator', 'Load Tester Output', 'Long Output Tool Operation'],
      answer: 0,
    },
    {
      q: '¿Cuál es el principal riesgo eléctrico en el hogar?',
      opts: ['Corto circuito', 'Sobrecarga de enchufes', 'Cables pelados', 'Todas las anteriores'],
      answer: 3,
    },
    {
      q: '¿Qué equipo de protección se debe usar al trabajar con electricidad?',
      opts: ['Guantes de látex', 'Guantes dieléctricos', 'Guantes de cuero', 'Guantes de tela'],
      answer: 1,
    },
    {
      q: '¿Qué hacer si un compañero recibe una descarga eléctrica?',
      opts: ['Tocarlo para ayudar', 'Cortar la fuente de energía primero', 'Lanzarle agua', 'Ignorar la situación'],
      answer: 1,
    },
    {
      q: '¿Cuál es el voltaje seguro para trabajos sin tensión?',
      opts: ['12V', '24V', '50V', 'Cero tensión (verificado)'],
      answer: 3,
    },
  ],

  'sustancias-peligrosas': [
    {
      q: '¿Qué documento contiene la información de seguridad de una sustancia química?',
      opts: ['Hoja de vida del producto', 'Ficha de Datos de Seguridad (SDS)', 'Manual de usuario', 'Certificado de calidad'],
      answer: 1,
    },
    {
      q: '¿Qué pictograma indica una sustancia inflamable?',
      opts: ['☠️ Calavera', '🔥 Llama', '💀 Cráneo', '⚠️ Signo de exclamación'],
      answer: 1,
    },
    {
      q: '¿Dónde deben almacenarse los productos químicos incompatibles?',
      opts: ['En el mismo estante', 'En áreas separadas', 'En cualquier lugar', 'Al aire libre'],
      answer: 1,
    },
    {
      q: '¿Qué significa el rombo NFPA 4 en color azul?',
      opts: ['Riesgo de incendio extremo', 'Riesgo para la salud letal', 'Riesgo de reacción violenta', 'Riesgo específico'],
      answer: 1,
    },
    {
      q: '¿Qué equipo debe usarse al manipular sustancias corrosivas?',
      opts: ['Guantes de tela', 'Guantes de nitrilo + gafas + delantal', 'Solo gafas', 'Barbijo común'],
      answer: 1,
    },
  ],

  'ruido-vibraciones': [
    {
      q: '¿A partir de qué nivel de ruido se debe usar protección auditiva?',
      opts: ['70 dB', '85 dB', '100 dB', '120 dB'],
      answer: 1,
    },
    {
      q: '¿Qué tipo de protector auditivo ofrece mayor atenuación?',
      opts: ['Tapones de espuma', 'Orejeras', 'Tapones moldes', 'Depende del nivel de ruido'],
      answer: 3,
    },
    {
      q: '¿Qué efecto tiene la exposición prolongada a vibraciones mano-brazo?',
      opts: ['Sordera', 'Síndrome de vibración (mano blanca)', 'Problemas de visión', 'Dolor de cabeza'],
      answer: 1,
    },
    {
      q: '¿Cada cuánto debe realizarse una audiometría?',
      opts: ['Cada 6 meses', 'Anualmente', 'Cada 2 años', 'Solo al inicio del empleo'],
      answer: 1,
    },
    {
      q: '¿Qué medida administrativa reduce la exposición al ruido?',
      opts: ['Usar maquinaria más ruidosa', 'Rotación de personal', 'Trabajar más horas', 'No usar protección'],
      answer: 1,
    },
  ],

  'espacios-confinados': [
    {
      q: '¿Qué es un espacio confinado?',
      opts: ['Un lugar con mucha gente', 'Un espacio con ventilación limitada y riesgos', 'Un espacio al aire libre', 'Un cuarto cerrado cualquiera'],
      answer: 1,
    },
    {
      q: '¿Qué se debe hacer antes de ingresar a un espacio confinado?',
      opts: ['Solo pedir permiso verbal', 'Realizar monitoreo atmosférico', 'No es necesario prepararse', 'Entrar rápidamente'],
      answer: 1,
    },
    {
      q: '¿Qué nivel de oxígeno es seguro en un espacio confinado?',
      opts: ['10-15%', '19.5-23.5%', '25-30%', 'Cualquier nivel es seguro'],
      answer: 1,
    },
    {
      q: '¿Quién debe vigilar desde el exterior?',
      opts: ['Nadie', 'Un vigía entrenado', 'El supervisor', 'Un compañero cualquiera'],
      answer: 1,
    },
    {
      q: '¿Qué equipo es obligatorio en espacios confinados?',
      opts: ['Casco y guantes', 'Monitor de gases, arnés y línea de vida', 'Linterna y botas', 'Radio y celular'],
      answer: 1,
    },
  ],
}
