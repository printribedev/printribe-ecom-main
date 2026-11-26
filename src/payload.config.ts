import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { ProductCategories } from './collections/ProductCategories'
import { PrintMethods } from './collections/PrintMethods'
import { Quotes } from './collections/Quotes'
import { Products } from './collections/Products'
import { Customers } from './collections/Customers'
import { Enquiries } from './collections/Enquiries'
import { Designs } from './collections/Designs'
import { Orders } from './collections/Orders'
import { ContactSettings } from './globals/ContactSettings'
import { ShopSettings } from './globals/ShopSettings'
import { Subscribers } from './collections/Subscribers'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  // Email: sent through Resend when RESEND_API_KEY is set. Without it, emails are only printed in the server log.
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        defaultFromName: 'Printribe',
        apiKey: process.env.RESEND_API_KEY,
      })
    : undefined,
  // Database: Supabase Postgres when POSTGRES_URL is set (live site), otherwise a local SQLite file.
  // On Postgres, tables are created by migrations (src/migrations), not by dev auto-push.
  db: process.env.POSTGRES_URL
    ? postgresAdapter({
        pool: { connectionString: process.env.POSTGRES_URL },
        push: false,
        migrationDir: path.resolve(dirname, 'migrations'),
      })
    : sqliteAdapter({
        client: { url: process.env.DATABASE_URL || 'file:./printribe-dev.db' },
      }),
  collections: [Pages, Posts, Media, Categories, ProductCategories, Products, PrintMethods, Designs, Customers, Enquiries, Quotes, Orders, Subscribers, Users],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, ShopSettings, ContactSettings],
  plugins: [
    ...plugins,
    // Media files go to Cloudflare R2 when its keys are set, otherwise to the local folder.
    ...(process.env.R2_ACCESS_KEY_ID
      ? [
          s3Storage({
            // Files go straight from the browser to R2. Vercel rejects uploads over 4.5 MB when they pass through the server (videos).
            clientUploads: true,
            collections: { media: { prefix: 'media', generateFileURL: ({ filename, prefix }) => `${process.env.R2_PUBLIC_URL}/${prefix}/${filename}` } },
            bucket: process.env.R2_BUCKET || '',
            config: {
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
              },
              region: 'auto',
              endpoint: process.env.R2_ENDPOINT,
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
