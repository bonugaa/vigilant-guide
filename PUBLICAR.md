# Publicar Clario gratis

La versión pública usa Supabase para datos, usuarios y facturas, y Vercel para servir la aplicación.

## 1. Supabase

1. Crea un proyecto en https://supabase.com/dashboard y elige una región europea.
2. Abre SQL Editor, pega todo el contenido de supabase/schema.sql y ejecútalo.
3. En Project Settings > API copia Project URL y la clave publishable/anon.
4. En Authentication > URL Configuration añade temporalmente la URL que Vercel genere.
5. Para Google, activa el proveedor Google en Authentication > Providers y completa las credenciales de Google Cloud.

## 2. GitHub

1. Crea un repositorio privado llamado clario-finanzas.
2. Sube todos los archivos del proyecto excepto data, dist y archivos .env.

## 3. Vercel

1. Crea una cuenta en https://vercel.com y elige Add New > Project.
2. Importa el repositorio privado de GitHub.
3. Añade estas variables de entorno:
   - SUPABASE_URL: Project URL de Supabase.
   - SUPABASE_ANON_KEY: clave publishable/anon de Supabase.
4. Pulsa Deploy. Vercel ejecutará npm run build y publicará la carpeta dist.
5. Copia la URL https://...vercel.app y añádela en Supabase Authentication > URL Configuration como Site URL y Redirect URL.
6. Vuelve a desplegar y prueba el registro, login, ventas, gastos, presupuestos y adjuntos.

## Seguridad

La clave publishable/anon sí puede estar en el navegador porque las políticas RLS limitan los datos al usuario autenticado. No utilices ni compartas la service_role key.

Antes de utilizar datos fiscales reales, valida los cálculos con una gestoría y publica una política de privacidad.
