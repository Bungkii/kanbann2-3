export type Task = {
  id: string;
  subject: string;
  due_date: string;
  details: string;
  image_url: string | null;
  teacher_name: string | null;
  status: string;
};

export function createMorningFlexMessage(tasks: Task[]) {
  const hasTasks = tasks.length > 0;

  const header = {
    type: "box",
    layout: "vertical",
    backgroundColor: "#FCD34D",
    contents: [
      {
        type: "text",
        text: "อรุณสวัสดิ์! ☀️",
        weight: "bold",
        size: "xl",
        color: "#1F2937",
      },
      {
        type: "text",
        text: "แจ้งเตือนงานที่ต้องส่งวันนี้",
        color: "#4B5563",
        size: "sm",
        marginTop: "sm",
      },
    ],
  };

  const bodyContents: any[] = [];

  if (!hasTasks) {
    bodyContents.push({
      type: "text",
      text: "วันนี้ไม่มีการบ้านที่ต้องส่ง! 🎉 เย้!",
      weight: "bold",
      size: "md",
      color: "#10B981",
      wrap: true,
      align: "center",
      margin: "md",
    });
  } else {
    tasks.forEach((task, index) => {
      bodyContents.push({
        type: "box",
        layout: "vertical",
        margin: index === 0 ? "none" : "lg",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: `📝 ${task.subject}`,
            weight: "bold",
            size: "md",
            wrap: true,
            color: "#111827",
          },
          {
            type: "text",
            text: task.details,
            size: "sm",
            color: "#6B7280",
            wrap: true,
            maxLines: 2,
          },
        ],
      });
      if (task.teacher_name) {
        bodyContents[bodyContents.length - 1].contents.push({
          type: "text",
          text: `สั่งโดย: ${task.teacher_name}`,
          size: "xs",
          color: "#9CA3AF",
        });
      }
    });
  }

  const body = {
    type: "box",
    layout: "vertical",
    spacing: "md",
    contents: bodyContents,
  };

  const footer = {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "uri",
          label: "ดูงานทั้งหมดบนเว็บ",
          uri: "https://your-domain.com", // TODO: Replace with actual domain
        },
      },
    ],
  };

  return {
    type: "flex",
    altText: "อรุณสวัสดิ์! แจ้งเตือนงานที่ต้องส่งวันนี้",
    contents: {
      type: "bubble",
      size: "kilo",
      header,
      body,
      footer,
    },
  };
}

export function createEveningFlexMessage(tasks: Task[]) {
  const total = tasks.length;
  // Note: 'status' is tracked via localStorage by clients.
  // The server only knows Supabase status. If we use this for all users, 
  // we might want to just show global stats or just "งานทั้งหมด".
  // For now, let's show global tasks that are 'todo' and 'in_progress'.

  const activeTasks = tasks.filter(t => t.status !== 'done');
  
  const header = {
    type: "box",
    layout: "vertical",
    backgroundColor: "#1E3A8A",
    contents: [
      {
        type: "text",
        text: "สรุปงานประจำวัน 🌙",
        weight: "bold",
        size: "xl",
        color: "#FFFFFF",
      },
      {
        type: "text",
        text: "อย่าลืมเคลียร์งานก่อนนอนนะ",
        color: "#BFDBFE",
        size: "sm",
        marginTop: "sm",
      },
    ],
  };

  const body = {
    type: "box",
    layout: "vertical",
    spacing: "md",
    contents: [
      {
        type: "text",
        text: "ภาระงานที่รอคุณอยู่:",
        weight: "bold",
        color: "#374151",
      },
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "งานทั้งหมดในระบบ:",
            color: "#6B7280",
            size: "sm",
          },
          {
            type: "text",
            text: `${total} งาน`,
            weight: "bold",
            align: "end",
            color: "#111827",
            size: "sm",
          },
        ],
      },
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "งานที่ยังไม่เสร็จ (รอเคลียร์):",
            color: "#EF4444",
            size: "sm",
          },
          {
            type: "text",
            text: `${activeTasks.length} งาน`,
            weight: "bold",
            align: "end",
            color: "#DC2626",
            size: "sm",
          },
        ],
      },
    ],
  };

  const footer = {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "button",
        style: "primary",
        color: "#4F46E5",
        height: "sm",
        action: {
          type: "uri",
          label: "ไปเคลียร์งานกันเลย!",
          uri: "https://your-domain.com", // TODO: Replace with actual domain
        },
      },
    ],
  };

  return {
    type: "flex",
    altText: "สรุปงานประจำวัน อย่าลืมเคลียร์งานนะ!",
    contents: {
      type: "bubble",
      size: "kilo",
      header,
      body,
      footer,
    },
  };
}
