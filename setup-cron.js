const API_KEY = 'i5PLtk/M+3/JjBxu2dgVpf+pmcJ7GbBxCvg53qPfb08=';

async function setupCrons(baseUrl) {
  // First get all jobs
  console.log("Fetching existing jobs...");
  const getRes = await fetch('https://api.cron-job.org/jobs', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const getJson = await getRes.json();
  const existingJobs = getJson.jobs || [];
  console.log(`Found ${existingJobs.length} existing jobs.`);

  const jobs = [
    { title: "Kanbann - Morning", path: "/api/cron/morning", schedule: { timezone: "Asia/Bangkok", hours: [6], minutes: [0], mdays: [-1], months: [-1], wdays: [-1] } },
    { title: "Kanbann - Evening", path: "/api/cron/evening", schedule: { timezone: "Asia/Bangkok", hours: [19], minutes: [0], mdays: [-1], months: [-1], wdays: [-1] } },
    { title: "Kanbann - Cleanup", path: "/api/cron/cleanup", schedule: { timezone: "Asia/Bangkok", hours: [7], minutes: [0], mdays: [-1], months: [-1], wdays: [-1] } },
    { title: "Kanbann - Reset Uniform", path: "/api/cron/reset-uniform", schedule: { timezone: "Asia/Bangkok", hours: [0], minutes: [0], mdays: [-1], months: [-1], wdays: [1] } },
    { title: "Kanbann - Bot 0500", path: "/api/cron/bot-0500", schedule: { timezone: "Asia/Bangkok", hours: [5], minutes: [0], mdays: [-1], months: [-1], wdays: [-1] } },
    { title: "Kanbann - Bot Anthem", path: "/api/cron/bot-anthem", schedule: { timezone: "Asia/Bangkok", hours: [8, 18], minutes: [0], mdays: [-1], months: [-1], wdays: [-1] } },
    { title: "Kanbann - Bot 2200", path: "/api/cron/bot-2200", schedule: { timezone: "Asia/Bangkok", hours: [22], minutes: [0], mdays: [-1], months: [-1], wdays: [-1] } }
  ];

  for (const job of jobs) {
    const existingJob = existingJobs.find(j => j.title === job.title);
    if (existingJob) {
      console.log(`Job ${job.title} already exists. Skipping.`);
      continue;
    }

    const payload = {
      job: {
        url: `${baseUrl}${job.path}`,
        enabled: true,
        saveResponses: true,
        title: job.title,
        schedule: job.schedule,
        requestMethod: 0
      }
    };

    console.log(`Creating job: ${job.title}...`);
    try {
      const response = await fetch('https://api.cron-job.org/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify(payload)
      });
      
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (!response.ok) {
          console.error(`Failed to create ${job.title}:`, data);
        } else {
          console.log(`Success! Job ID: ${data.jobId}`);
        }
      } catch (e) {
         console.error(`Failed to parse JSON for ${job.title}. Status: ${response.status} Text: ${text}`);
      }
    } catch (err) {
      console.error(`Error for ${job.title}:`, err);
    }
    
    // sleep to prevent rate limits
    await new Promise(r => setTimeout(r, 10000));
  }
}

let url = process.argv[2];
if (url.endsWith('/')) url = url.slice(0, -1);
setupCrons(url);
