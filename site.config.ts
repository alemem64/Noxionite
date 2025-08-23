import { siteConfig } from './lib/site-config.ts'
import locale from './site.locale.json'

export const domain = 'noxionite.vercel.app'

const siteConfigObject = {
  // the site's root Notion page (required)
  rootNotionPageId: '251f2d475c3180d28fb1c28911fbbe75',

  // The database id for the blog (required)
  rootNotionDatabaseId: '251f2d475c3181c3a9f2ff6f477bbf25',

  // basic site info (required)
  name: 'Noxionite',
  domain,
  author: 'Jaewan Shin',

  // open graph metadata (optional)
  description: 'Your Notion pages, reborn as a stunning blog',

  // hero section (optional)
  heroAssets: [
    {
      type: 'video',
      src: '/hero-assets/noxionite-shiny.mov',
      url: 'https://bit.ly/alemem64',
      content: {
        ko: {
          title: 'Noxionite',
          description: 'Notion으로 만드는 가장 아름다운 블로그'
        },
        en: {
          title: 'Noxionite',
          description: 'Your Notion pages, reborn as a stunning blog.'
        }
      }
    },
  ] as const,

  // author metadata (optional)
  authors: [
    {
      name: 'Jzahnny',                       // Author name
      avatar_dir: '/authors/Jzahnny.jpeg',   // Author avatar image path in public folder (28px x 28px recommended)
      home_url: 'https://bit.ly/alemem64',   // Author home URL
    }
  ],

  // social links, the order is preserved.
  socials: {
    github: 'alemem64',  // optional github username
    linkedin: 'alemem64', // optional linkedin username
    youtube: 'channel/UCV7iVbVip33wD_rsiQLSubg?si=Tf0bKAPvtDY_J833', // optional youtube channel id eg. channel/UCXXXXXXXXXXXXXXXXXXXXXX
    instagram: 'alemem64', // optional instagram username
    // tiktok: '#', // optional tiktok username
    // threads: '#', // optional threads username
    // facebook: '#',  // optional facebook profile id on profile page eg. 1000XXXXXXXXXXX
    // twitter: '#', // optional twitter username
    // mastodon: '#', // optional mastodon profile URL, provides link verification
    // newsletter: '#' // optional personal newsletter URL
  },

  // locale configuration
  locale,

  // Incremental Static Regeneration (ISR) configuration
  isr: {
    revalidate: 60 // revalidate time in seconds
  }
}

export default siteConfig(siteConfigObject)
