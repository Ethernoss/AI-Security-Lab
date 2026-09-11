# AI Security Lab

**Español** | [English](README.en.md)

Laboratorio personal de ingeniería de seguridad de **Jorge · Ethernoss**, construido para aprender mediante implementación, pruebas controladas, remediación y revisión de evidencia.

La pregunta que guio el proyecto fue: **¿cómo construir una base de infraestructura y controles de seguridad, comprobar su comportamiento y aplicar ese aprendizaje a agentes de IA que consultan hallazgos o solicitan herramientas?**

Este repositorio reúne únicamente los módulos con código, configuraciones o evidencia disponibles. Es una selección de las prácticas realizadas, **no la entrega de todos los sprints del plan original**. Los resultados corresponden a las ejecuciones conservadas en el laboratorio; no son una certificación de seguridad ni un escaneo actualizado.

## Qué buscaba con este proyecto

Quería conectar varias etapas del trabajo de un ingeniero de seguridad: crear infraestructura reproducible, detectar problemas en código y aplicaciones, aplicar controles, volver a medir y documentar qué se resolvió y qué quedó pendiente. Sobre esa base, exploré cómo cambia el riesgo cuando un modelo de lenguaje interpreta información externa y puede pedir acciones sobre un sistema.

El método fue: **construir → probar → observar → corregir → volver a probar → documentar**. El entorno principal fue un Mac con Apple Silicon, contenedores Docker, Terraform, Node.js, OWASP ZAP, Snyk y un modelo local con Ollama.

## Trabajo realizado y evidencia

| Módulo | Qué implementé o probé | Resultado respaldado | Evidencia |
| --- | --- | --- | --- |
| Infraestructura como código | Red Docker, imagen y contenedor Nginx gestionados con Terraform; cambios y recuperación de desviaciones | El plan final conservado indica que la infraestructura coincide con la configuración | [Bitácora](docs/evidence/terraform-lab.md) · [Plan final](evidence/terraform/final-plan.txt) |
| SAST y SCA | Análisis de una aplicación Express con Snyk Code y revisión de dependencias | SAST inicial: 5 hallazgos; SCA: sin rutas vulnerables conocidas en las ejecuciones guardadas | [SAST inicial](appsec/sast/evidence/snyk-sast-before.txt) · [SCA inicial](appsec/sast/evidence/snyk-sca-before.txt) · [SCA posterior](appsec/sast/evidence/snyk-sca-after.txt) |
| DAST y hardening | Escaneos ZAP y ajustes de cabeceras, validación de entrada y límites de solicitudes | El JSON baseline pasa de 10 a 2 entradas de alerta, incluyendo informativas; queda una alerta CSP de riesgo medio | [Inicial](appsec/dast/reports/zap-baseline-before.json) · [Final](appsec/dast/reports/zap-baseline-final.json) · [Notas](appsec/dast/notes/dast-results.md) |
| Seguridad de IA | Agentes vulnerables y un agente con controles; inyección indirecta, solicitudes de secretos y autorización de herramientas | Hay evidencia de bloqueo por política y exigencia de aprobación humana; persisten limitaciones en las respuestas del modelo | [Resultados](ai-security/evidence/secure/security-controls-results.txt) · [Ejecución final](ai-security/evidence/secure/security-controls-final.txt) |
| WAF local y túnel | Nginx detrás de ModSecurity + OWASP CRS; arquitectura con Cloudflare Quick Tunnel | Prueba local: HTTP 200 para tráfico normal y HTTP 403 para cuatro patrones de ataque | [Resultados WAF](cloudflare-waf/evidence/local-waf-test.txt) · [Arquitectura](cloudflare-waf/docs/architecture.md) |
| Gestión de vulnerabilidades — parcial | Objetivo Juice Shop, reportes ZAP y exportación SCA preparada para centralización | Reporte de Juice Shop con 16 entradas de alerta; no se acredita el ciclo completo en DefectDojo | [Alcance del módulo](vulnerability-management/README.md) · [Reporte](vulnerability-management/scans/juice-shop/juice-shop-baseline.json) |

## 1. Infraestructura reproducible con Terraform

Provisioné una red Docker, una imagen Nginx y un contenedor web. La bitácora registra el ciclo de inicialización, validación, planificación, aplicación y consulta del estado, además de una prueba de modificación o eliminación manual del contenedor para observar el drift y recuperarlo.

Se conservan la [configuración](terraform/docker-lab/main.tf), la [lista de recursos](evidence/terraform/state-list.txt), el [contenedor en ejecución](evidence/terraform/docker-running.txt) y el plan final sin cambios. El servicio usa el puerto **8081**. Los archivos de estado y variables sensibles quedan fuera del repositorio.

## 2. Detección y remediación en una aplicación web

Trabajé sobre una aplicación Node.js/Express con un endpoint `/ping`. El análisis SAST inicial reportó inyección de comandos y falta de límites en el código de la aplicación, junto con hallazgos en dependencias incluidas en el análisis.

La [versión de código conservada](appsec/sast/vulnerable-app/app.js) ya contiene las correcciones: `execFile` con argumentos separados, validación de direcciones IP, tiempo máximo de ejecución, límite de solicitudes y cabeceras de seguridad con Helmet. La carpeta mantiene el nombre histórico `vulnerable-app`, aunque contiene esa versión endurecida.

Snyk SCA reportó 67 dependencias en la ejecución inicial y 68 en la posterior, sin rutas vulnerables conocidas en ambas. No se conserva un reporte SAST posterior válido que permita afirmar que los cinco hallazgos iniciales quedaron cerrados.

Con ZAP guardé reportes baseline inicial, intermedio y final, además de un escaneo activo. Los JSON registran **10 → 4 → 2 entradas de alerta** en los tres baseline; estas entradas incluyen alertas informativas y no equivalen al número de comprobaciones o categorías de advertencia de la salida de consola. Las notas históricas registran 8 → 2 categorías de advertencia y 59 → 65 comprobaciones aprobadas; son una métrica distinta.

El [reporte activo](appsec/dast/reports/zap-full-before.json) contiene tres entradas: una alerta CSP de riesgo medio y dos informativas. Las notas registran 140 comprobaciones aprobadas, ninguna fallida y una advertencia restante. El nombre `full-before` es histórico: su fecha es posterior al baseline final. La advertencia CSP afecta respuestas 404 de `/robots.txt` y `/sitemap.xml`; quedó documentada para evaluación, sin afirmar que el sistema completo esté libre de vulnerabilidades.

## 3. Seguridad de agentes de IA

Construí agentes locales con **Ollama y `llama3.2:3b`**, usando hallazgos sintéticos como entrada. Uno de ellos contiene una instrucción maliciosa dentro de la descripción de un hallazgo para intentar cambiar la tarea y solicitar el aislamiento de un endpoint.

Implementé una versión con separación explícita de datos no confiables, salida JSON, validación de acciones, lista de herramientas permitidas, bloqueo de solicitudes de secretos, minimización de datos y registro de auditoría. Las solicitudes de aislamiento o eliminación requieren una decisión `HITL_REQUIRED`; las herramientas de alto impacto son simulaciones y el agente protegido no ejecuta esas acciones ni implementa un flujo posterior de aprobación.

Las pruebas conservadas muestran:

- El agente vulnerable dejó de resumir el hallazgo siguiendo su contenido inyectado. Esa evidencia no muestra ejecución de una herramienta destructiva.
- Una ejecución del agente protegido solicitó `isolate_endpoint` y la aplicación exigió aprobación humana.
- Las solicitudes explícitas de secretos y de todos los hallazgos fueron bloqueadas por política.
- Las respuestas del modelo variaron: algunas repitieron o incorporaron instrucciones del hallazgo malicioso. En la ejecución final, el caso llamado “unknown tool” produjo una petición permitida a `get_finding`, por lo que ese caso no demuestra por sí solo el rechazo de `shell`.
- Se conserva una [prueba del control de herramientas](ai-security/evidence/secure/tool-control-tests.txt) con lectura permitida, acción de alto impacto bloqueada y herramienta desconocida denegada.

El aprendizaje central fue que **las instrucciones al modelo necesitan controles de autorización en la aplicación**. Los filtros por palabras, la validación parcial y las herramientas simuladas de este laboratorio no constituyen una defensa completa contra prompt injection ni una integración MCP desplegada.

## 4. WAF local y Cloudflare Tunnel

Implementé un origen Nginx detrás de un WAF local con ModSecurity y OWASP Core Rule Set. La arquitectura documentada contempla:

```text
Internet → Cloudflare Edge → Quick Tunnel → WAF local → Nginx
```

El [script de pruebas](cloudflare-waf/tests/waf-tests.sh) envía tráfico normal y patrones de SQL injection, XSS, path traversal e inyección de comandos. La evidencia local registra **200 para la petición normal y 403 para los cuatro patrones**.

Cloudflare aporta el túnel y el acceso mediante su edge. El filtrado demostrado corresponde a **ModSecurity + OWASP CRS local**. No se configuraron reglas WAF personalizadas de Cloudflare ni se conserva un reporte equivalente de pruebas de extremo a extremo a través del túnel.

## 5. Gestión de vulnerabilidades: avance conservado

Preparé OWASP Juice Shop como objetivo, ejecuté ZAP y generé reportes HTML, JSON y XML. El reporte registra 16 entradas para `http://juice-shop:3000`: **1 alta, 4 medias, 7 bajas y 4 informativas**. Son alertas del escáner pendientes de validación, no 16 vulnerabilidades confirmadas. El mismo reporte incluye hosts externos descubiertos durante la navegación; su presencia no acredita pruebas autorizadas o completas sobre esos terceros.

La exportación SCA guardada contiene 69 dependencias y ninguna vulnerabilidad reportada. La centralización en DefectDojo formaba parte del objetivo, pero no hay evidencia suficiente de importación, deduplicación, priorización, remediación y cierre. Trivy tampoco tiene resultados conservados. El detalle y las limitaciones están en el [README del módulo](vulnerability-management/README.md).

## Organización del repositorio

```text
ai-security/                  Agentes, datos sintéticos, pruebas y evidencia
appsec/sast/                  Aplicación endurecida y resultados Snyk
appsec/dast/                  Reportes ZAP y notas de remediación
cloudflare-waf/               WAF, origen Nginx, pruebas y arquitectura
terraform/docker-lab/         Infraestructura Docker definida con Terraform
evidence/terraform/           Evidencia de recursos y estado final
docs/evidence/                Bitácora Terraform e intentos iniciales Snyk
vulnerability-management/     Juice Shop, exportación SCA y reportes ZAP
```

Los intentos Snyk ejecutados desde `docs/` se conservan como evidencia de errores de selección de directorio; no son análisis exitosos. Se excluyeron la exportación SAST vacía, las dependencias instaladas, modelos locales, secretos, estados y planes binarios Terraform (incluido `out-plan.txt`) y la copia de `archify`, que es un proyecto independiente.

## Cómo revisar y repetir las prácticas

Para revisar lo realizado, empieza por los enlaces de evidencia de la tabla. Los HTML pueden descargarse y abrirse en el navegador. Para nuevas ejecuciones se requieren las herramientas de cada módulo; no hay un despliegue único de todo el laboratorio. Las aplicaciones vulnerables y los escaneos deben utilizarse exclusivamente en entornos propios o autorizados.

### Control de herramientas sin modelo

Desde la raíz del repositorio, con Node.js:

```bash
node ai-security/secure-agent/secure-tool-router.js '{"tool":"get_finding","target":"VULN-001"}'
node ai-security/secure-agent/secure-tool-router.js '{"tool":"isolate_endpoint","target":"PC-LAB-001"}'
node ai-security/secure-agent/secure-tool-router.js '{"tool":"shell","target":"whoami"}'
```

Las decisiones esperadas son `ALLOW`, `HITL_REQUIRED` y `DENY`, respectivamente.

### Pruebas con el modelo local

Con Node.js compatible con `fetch` y Ollama instalado, inicia el servidor en una terminal:

```bash
bash ai-security/scripts/start-ollama.sh
```

En otra terminal:

```bash
ollama pull llama3.2:3b
bash ai-security/tests/run-security-controls.sh
```

El script muestra respuestas para revisión manual; no es una suite con aserciones automáticas. Las respuestas pueden variar entre ejecuciones. El registro `audit.log` generado queda excluido de Git.

### WAF local

Con Docker en ejecución:

```bash
docker compose -f cloudflare-waf/compose.yml up -d
bash cloudflare-waf/tests/waf-tests.sh
docker compose -f cloudflare-waf/compose.yml down
```

El WAF escucha en `127.0.0.1:8088`. Este procedimiento comprueba el componente local; el túnel no se inicia desde Compose.

### Terraform

```bash
cd terraform/docker-lab
terraform init
terraform validate
terraform plan
terraform apply
# Al terminar la práctica:
terraform destroy
```

Revisa el plan antes de aplicar o destruir. El puerto 8081 debe estar libre; no ejecutes simultáneamente la variante experimental de ZAP que usa el mismo puerto. Para Juice Shop utiliza las indicaciones del [módulo](vulnerability-management/README.md).

## Alcance y aprendizajes

Este trabajo me permitió practicar infraestructura reproducible, lectura crítica de resultados de escáneres, endurecimiento de aplicaciones, comparación antes/después, filtrado HTTP y separación entre decisiones del modelo y autorización de herramientas.

La evidencia también mostró por qué importa registrar limitaciones: un escaneo sin hallazgos no demuestra ausencia de riesgo; una respuesta del modelo no demuestra que una herramienta se ejecutó; y tener una plataforma o un plan de pruebas no equivale a haber completado su ciclo de validación.

Endpoint Security, Detection Engineering, Incident Response y MCP Security formaban parte de la visión inicial, pero no se presentan aquí como sprints completados porque no hay entregables suficientes en esta selección.

La versión publicada conserva los reportes históricos y adapta las rutas de los scripts de IA para que no dependan del disco del autor. También corrige la URL de salida de Terraform para reflejar el puerto 8081 de la configuración. Estas adaptaciones de publicación no se atribuyen a las ejecuciones históricas.
