// Descripciones breves de los seis tipos RIASEC para la interpretación del perfil.
// Base teórica: Holland (1997), citado en el artículo. La redacción es del prototipo y está
// pendiente de revisión por la psicóloga o la tutora del equipo; no es material de un test oficial.

export const TIPOS_RIASEC = Object.freeze({
  R: Object.freeze({ nombre: 'Realista', corto: 'Hacer y construir',
    descripcion: 'Suele disfrutar actividades prácticas: usar herramientas o máquinas, trabajar con plantas, animales o materiales, y resolver problemas concretos, muchas veces al aire libre.' }),
  I: Object.freeze({ nombre: 'Investigador', corto: 'Observar y analizar',
    descripcion: 'Suele interesarse por comprender cómo funcionan las cosas: observar, investigar, hacer preguntas, analizar datos y resolver problemas con razonamiento y ciencia.' }),
  A: Object.freeze({ nombre: 'Artístico', corto: 'Crear y expresar',
    descripcion: 'Suele preferir actividades creativas: expresar ideas mediante el arte, la música, la escritura, el diseño u otras formas, con libertad para innovar.' }),
  S: Object.freeze({ nombre: 'Social', corto: 'Ayudar y enseñar',
    descripcion: 'Suele disfrutar trabajar con personas: ayudar, enseñar, cuidar, orientar o acompañar a otros en su bienestar y aprendizaje.' }),
  E: Object.freeze({ nombre: 'Emprendedor', corto: 'Liderar y convencer',
    descripcion: 'Suele interesarse por organizar proyectos, liderar grupos, tomar decisiones, convencer a otras personas y emprender iniciativas o negocios.' }),
  C: Object.freeze({ nombre: 'Convencional', corto: 'Organizar y ordenar',
    descripcion: 'Suele preferir tareas ordenadas y con procedimientos claros: organizar información, llevar registros, trabajar con datos y cuidar los detalles.' }),
});

export const NOTA_TIPOS = 'Descripciones generales basadas en la teoría de Holland (1997). Redacción del prototipo, pendiente de revisión profesional.';
