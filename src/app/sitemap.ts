import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const studentUrl = 'https://primjaa.bungkii.app'
  const parentUrl = 'https://kanbann.bungkii.app'
  const now = new Date()

  return [
    // 🎓 Student Portal (Primjaa / พริมจ๋า ม.2/3)
    {
      url: studentUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${studentUrl}/kanban`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.95,
    },
    {
      url: `${studentUrl}/schedule`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${studentUrl}/summaries`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${studentUrl}/exam-topics`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${studentUrl}/homework-feed`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.85,
    },
    {
      url: `${studentUrl}/funds`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${studentUrl}/election`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${studentUrl}/evaluate-boss`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${studentUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // 👨‍👩‍👧 Parent Portal (Kanbann ม.2/3 สำหรับผู้ปกครอง)
    {
      url: parentUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${parentUrl}/assignments`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.95,
    },
    {
      url: `${parentUrl}/exams`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${parentUrl}/funds`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${parentUrl}/manual`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${studentUrl}/manual`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
