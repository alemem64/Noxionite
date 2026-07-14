# Noxionite

> The most beautiful blog made with Notion

![SCR-20250824-kvxf](https://github.com/user-attachments/assets/9237e080-a604-468e-b2e1-e7ec40e64b14)

# Demo
https://noxionite.leapsignal.net/

# 1. Overview

Noxionite is a powerful blog engine that turns your Notion posts into a personal blog site. It is built based on [react-notion-x](https://github.com/NotionX/react-notion-x)!

# 2. Features

## 2.1. Compatibility with all Notion editing features

<img width="849" height="559" alt="SCR-20250824-kwfj" src="https://github.com/user-attachments/assets/b418a3a3-ad58-482d-8d1b-68978fb3870c" />

<img width="812" height="502" alt="SCR-20250824-kwid" src="https://github.com/user-attachments/assets/dc743697-11ed-47aa-9843-428850ca27f6" />

<img width="874" height="834" alt="SCR-20250824-kwmh" src="https://github.com/user-attachments/assets/7cd31b95-486d-4f79-ae5c-80ed6dfbc890" />

Based on [react-notion-x](https://github.com/NotionX/react-notion-x), you can use all of Notion's blocks.

Learn more: https://noxionite.leapsignal.net/en/post/features-notion

## 2.2. Extremely fast routing with ISR

![Project 2025-08-24 at 07 26 30](https://github.com/user-attachments/assets/31c2fe65-4fae-4208-9c24-c35d0906ebac)

Pages are pre-rendered at build time and Notion pages are updated every 60 seconds, so page navigation takes less than 0.2 seconds.

## 2.3. Organize your posts with infinite folder-style categories

<img width="310" height="525" alt="SCR-20250824-kwtw" src="https://github.com/user-attachments/assets/9a5d0d00-7a2d-4f81-a967-3ce7c8e47314" />

You can organize your blog in a folder-like structure with endless categories.

Learn more: https://noxionite.leapsignal.net/en/post/features-notion

## 2.4. Automatic table of contents management

<img width="2032" height="1191" alt="SCR-20250824-kwzo" src="https://github.com/user-attachments/assets/c011c569-8736-4348-8f1b-54e1fb6eb332" />

You can automatically manage the table of contents with Notion's headings.

## 2.5. Graph View

![Project 2025-08-24 at 08 13 44](https://github.com/user-attachments/assets/b5beecdf-d6b6-42cd-916d-4b59ae36d599)

In 'Post View', you can see the entire hierarchical structure of categories and posts at a glance.

In 'Tag View', you can see the structure of tags at a glance by gathering tags that appear together in a post.

## 2.6. Glassmorphism Design

https://github.com/user-attachments/assets/f56586a6-f34d-4f6c-9fe5-41c4a52da2cb

Beautiful glassmorphism design is applied to all pages, and it also supports dark/white mode.

<img width="643" height="1192" alt="SCR-20250824-hiig" src="https://github.com/user-attachments/assets/de5712e7-3e19-44a8-b829-206c7ad12642" />

It is also responsive and works perfectly on mobile.

## 2.7. Automatic social image generation

![setup](https://github.com/user-attachments/assets/6a0f7a79-e91d-43bd-b5a6-c02860d1f07e)

Automatically creates and manages social images and og meta tags that are created when sharing on SNS.

## 2.8. Support for 23 languages

It supports translation for 23 languages and you can build your blog in many more languages.

<img width="5654" height="3605" alt="Flags (1)" src="https://github.com/user-attachments/assets/9f84df13-98a5-4c61-b6f0-6a00a1dd21a8" />

## 2.9. Simultaneous work by multiple editors

Multiple people can work on a single blog at the same time and set them as co-authors.

## 2.10. Completely open source, free

It is completely open source and free to use under the MIT license.

# 3. Installation

Please check the link below for installation instructions.

[https://noxionite.leapsignal.net/en/post/setup](https://noxionite.leapsignal.net/post/setup)

[If the above link does not work, see this page.](https://alemem64.notion.site/Getting-Started-259f2d475c318068a84bfa73776fcda7)

# 4. License

MIT © Jaewan Shin

# 5. Known Issues

## 5.1. OG Tags are generated but not reflected on social platforms
All tags are properly included in the `<head>` section, but social platforms fail to detect them.

## 5.2. Locale detection fails when accessing URLs with empty locale, redirecting to 404 page

## 5.3. Occasional issue where only partial Notion database is fetched when routing through CategoryTree
This appears to be related to ISR caching.

## 5.4. Social images are not displayed on serverless platforms like Vercel
This occurs because the system generates image files directly using Puppeteer, which requires a server environment.
