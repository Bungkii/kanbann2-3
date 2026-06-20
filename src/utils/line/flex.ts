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
    backgroundColor: "#DC2626",
    contents: [
      {
        type: "text",
        text: "📢 งานที่ต้องส่งวันนี้",
        weight: "bold",
        size: "xl",
        color: "#FFFFFF",
      },
      {
        type: "text",
        text: new Date().toLocaleDateString('th-TH', { dateStyle: 'long' }),
        color: "#FEE2E2",
        size: "sm",
        margin: "sm",
      },
    ],
  };

  const bodyContents: any[] = [];

  if (!hasTasks) {
    bodyContents.push({
      type: "text",
      text: "วันนี้ไม่มีการบ้านที่ต้องส่ง 🎉",
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
          label: "ดูงานทั้งหมด",
          uri: "https://kanbann.bungkii.vercel.app/kanban", // TODO: Replace with actual domain
        },
      },
    ],
  };

  return {
    type: "flex",
    altText: hasTasks ? `มีงานต้องส่งวันนี้ ${tasks.length} รายการ!` : "วันนี้ไม่มีงานต้องส่ง",
    contents: {
      type: "bubble",
      size: "kilo",
      header,
      body,
      footer,
    },
  };
}

export function createTodayAddedFlexMessage(tasks: Task[]) {
  // Show tasks added to the system today
  const hasTasks = tasks.length > 0;
  const todayStr = new Date().toLocaleDateString('th-TH', { dateStyle: 'long' });

  const header = {
    type: "box",
    layout: "vertical",
    backgroundColor: "#1E3A8A",
    contents: [
      {
        type: "text",
        text: "📋 สรุปงานทั้งหมด",
        weight: "bold",
        size: "xl",
        color: "#FFFFFF",
      },
      {
        type: "text",
        text: todayStr,
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
      text: "ยังไม่มีงานถูกบันทึกในระบบ",
      weight: "bold",
      size: "md",
      color: "#6B7280",
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
      const isDueToday = dueDate.getTime() === todayDate.getTime();

      const icon = isOverdue ? '🚨' : isDueToday ? '⚠️' : '📝';
      const color = isOverdue ? '#DC2626' : isDueToday ? '#D97706' : '#111827';

      bodyContents.push({
        type: "box",
        layout: "vertical",
        margin: index === 0 ? "none" : "lg",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: `${icon} ${task.subject}`,
            weight: "bold",
            size: "md",
            wrap: true,
            color,
          },
          {
            type: "text",
            text: `กำหนดส่ง: ${new Date(task.due_date).toLocaleDateString('th-TH', { dateStyle: 'short' })}`,
            size: "xs",
            color: "#6B7280",
          },
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
          label: "ดูรายละเอียด",
          uri: "https://kanbann.bungkii.vercel.app/kanban",
        },
      },
    ],
  };

  return {
    type: "flex",
    altText: hasTasks ? `สรุปงานในระบบทั้งหมด ${tasks.length} รายการ` : "ยังไม่มีงานในระบบ",
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
        text: "ด้วยความปรารถนาดีจากชามนพิ",
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
      text: "วันนี้ไม่มีงานค้างจ้า",
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
      text: "วันนี้มีงานค้างอยู่",
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
          label: "รายละเอียดเพิ่มเติม",
          uri: "https://kanbann.bungkii.vercel.app/kanban", // TODO: Replace with actual domain
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
