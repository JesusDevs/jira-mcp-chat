# 🎯 Sistema de Templates de Jira

Este directorio contiene templates estructurados para crear issues de Jira de forma consistente y completa.

## 📁 Estructura de Templates

```
templates/
├── epics/              # Templates para épicas
│   ├── product-epic.json     # Épicas de producto
│   └── technical-epic.json   # Épicas técnicas
├── hdus/               # Historias de Usuario
│   ├── feature-story.json    # Features nuevos
│   └── bug-story.json        # Corrección de bugs
├── team-context/       # Contextos de equipos
│   ├── frontend-team.json    # Estándares frontend
│   └── backend-team.json     # Estándares backend
└── dod/                # Definition of Done
    ├── epic-dod.json         # DoD para épicas
    └── story-dod.json        # DoD para historias
```

## 🚀 Uso de Templates

### Via MCP Tools

```javascript
// Listar templates disponibles
await callTool('list_jira_templates', {
  category: 'epics' // opcional: epics, hdus, team-context, dod
});

// Crear issue desde template
await callTool('create_jira_from_template', {
  template: 'product-epic',
  variables: {
    epic_name: 'Nuevo Sistema de Pagos',
    objective: 'Implementar pagos con tarjeta',
    business_value: 'Aumentar conversión en 15%'
  },
  team_context: 'frontend-team', // opcional
  project: 'PROJ' // opcional, default: AIDEV
});
```

### Via Chat Client

```
"Crea una épica de producto para el nuevo sistema de login con SSO"

"Usa el template de bug para reportar el problema de carga lenta"

"Lista todos los templates disponibles"
```

## 📋 Templates Disponibles

### 🎯 Épicas

- **product-epic**: Para funcionalidades de producto
  - Variables: epic_name, objective, business_value, target_user, etc.
  
- **technical-epic**: Para mejoras técnicas
  - Variables: technical_objective, current_problem, proposed_solution, etc.

### 📝 Historias de Usuario

- **feature-story**: Para nuevas funcionalidades
  - Variables: feature_summary, user_role, user_want, user_benefit, etc.
  
- **bug-story**: Para corrección de bugs
  - Variables: bug_summary, bug_description, steps_to_reproduce, etc.

### 👥 Contextos de Equipo

- **frontend-team**: Estándares y DoD para frontend
- **backend-team**: Estándares y DoD para backend

### ✅ Definition of Done

- **epic-dod**: Criterios para épicas completas
- **story-dod**: Criterios para historias completas

## 🎨 Personalización

### Crear Nuevo Template

1. **Crear archivo JSON** en la carpeta apropiada:
```json
{
  "name": "Mi Template",
  "description": "Descripción del template",
  "issueType": "Story|Epic|Bug",
  "fields": {
    "summary": "{variable_name}",
    "description": "Descripción con {variables}",
    "priority": "Medium",
    "labels": ["label1", "{dynamic_label}"]
  },
  "variables": {
    "variable_name": "Descripción de la variable",
    "dynamic_label": "Etiqueta dinámica"
  }
}
```

2. **Reiniciar MCP Server** para detectar el nuevo template

### Modificar Template Existente

1. **Editar archivo JSON** correspondiente
2. **Modificar variables** según necesidades
3. **Reiniciar MCP Server**

## 🔧 Variables Dinámicas

### Variables Globales
- `{team_context}`: Se reemplaza con el contexto del equipo seleccionado
- `{current_date}`: Fecha actual
- `{current_user}`: Usuario actual (si está disponible)

### Variables por Template
Cada template define sus propias variables en el campo `variables`.

## 🎯 Mejores Prácticas

### Para Épicas
- ✅ Define objetivos claros y medibles
- ✅ Incluye valor de negocio específico
- ✅ Lista historias de usuario relacionadas
- ✅ Establece métricas de éxito

### Para Historias
- ✅ Usa formato "Como... Quiero... Para..."
- ✅ Define criterios de aceptación específicos
- ✅ Incluye casos de prueba
- ✅ Referencia mockups/wireframes

### Para Bugs
- ✅ Pasos claros para reproducir
- ✅ Screenshots o videos adjuntos
- ✅ Información del entorno
- ✅ Análisis técnico del problema

## 🆘 Troubleshooting

**Template no aparece:**
- Verifica sintaxis JSON válida
- Reinicia el MCP Server
- Revisa logs del servidor

**Variables no se reemplazan:**
- Verifica nombres exactos en `variables`
- Usa llaves correctas: `{variable_name}`
- Asegúrate de pasar todas las variables requeridas

**Error al crear issue:**
- Verifica credenciales de Jira
- Confirma que el proyecto existe
- Revisa permisos de usuario en Jira
