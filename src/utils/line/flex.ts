export type Task = {
  id: string;
  subject: string;
  due_date: string;
  details: string;
  image_url: string | null;
  teacher_name: string | null;
  submission_method: string | null;
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
        margin: "sm",
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
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    tasks.forEach((task, index) => {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = dueDate.getTime() < todayDate.getTime();

      bodyContents.push({
        type: "box",
        layout: "vertical",
        margin: index === 0 ? "none" : "lg",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: `${isOverdue ? '🚨 [เลยกำหนด]' : '📝'} ${task.subject}`,
            weight: "bold",
            size: "md",
            wrap: true,
            color: isOverdue ? "#EF4444" : "#111827",
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
      if (task.submission_method) {
        bodyContents[bodyContents.length - 1].contents.push({
          type: "text",
          text: `วิธีส่ง: ${task.submission_method}`,
          size: "xs",
          color: "#D97706",
          weight: "bold",
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
  // Evening: We want to show tasks due today or overdue.
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const dueTasks = tasks.filter(task => {
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() <= todayDate.getTime();
  });

  const hasTasks = dueTasks.length > 0;
  
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
        margin: "sm",
      },
    ],
  };

  const bodyContents: any[] = [];

  if (!hasTasks) {
    bodyContents.push({
      type: "text",
      text: "วันนี้ไม่มีงานค้างจ้า พักผ่อนได้เลย! 😴",
      weight: "bold",
      size: "md",
      color: "#10B981",
      wrap: true,
      align: "center",
      margin: "md",
    });
  } else {
    bodyContents.push({
      type: "text",
      text: "วันนี้มีงานที่ต้องทำ/ค้างอยู่นะ!",
      weight: "bold",
      color: "#EF4444",
      size: "md",
      margin: "md",
    });

    dueTasks.forEach((task, index) => {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = dueDate.getTime() < todayDate.getTime();

      bodyContents.push({
        type: "box",
        layout: "vertical",
        margin: index === 0 ? "md" : "lg",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: `${isOverdue ? '🚨 [เลยกำหนด]' : '📌'} ${task.subject}`,
            weight: "bold",
            size: "sm",
            wrap: true,
            color: isOverdue ? "#DC2626" : "#374151",
          }
        ],
      });
      if (task.submission_method) {
        bodyContents[bodyContents.length - 1].contents.push({
          type: "text",
          text: `วิธีส่ง: ${task.submission_method}`,
          size: "xs",
          color: "#D97706",
          weight: "bold",
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
        style: "primary",
        color: "#4F46E5",
        height: "sm",
        action: {
          type: "uri",
          label: "คลิกเคลียร์งาน",
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
