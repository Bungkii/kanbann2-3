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
        text: "📢 แจ้งเตือนงานวันนี้",
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
        text: "📢 สรุปงานประจำวัน",
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
    altText: "สรุปงานประจำวัน อย่าลืมเคลียร์งานนะจ้ะ",
    contents: {
      type: "bubble",
      size: "kilo",
      header,
      body,
      footer,
    },
  };
}

export function createMenuFlexMessage() {
  return {
    type: "flex",
    altText: "เมนูคำสั่งของชามนพิ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1E3A8A",
        contents: [
          {
            type: "text",
            text: "พริมจ๋า เมนู",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: "เลือกคำสั่งที่ต้องการได้เลยคราบ",
            color: "#BFDBFE",
            size: "sm",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#4F46E5",
            margin: "sm",
            action: {
              type: "uri",
              label: "เพิ่ม/ลบ งานใหม่",
              uri: "https://kanbann.bungkii.vercel.app/add",
            },
          },
          {
            type: "button",
            style: "primary",
            color: "#4F46E5",
            margin: "sm",
            action: {
              type: "uri",
              label: "ตรวจสอบงาน",
              uri: "https://kanbann.bungkii.vercel.app/kanban",
            },
          },
          {
            type: "button",
            style: "secondary",
            margin: "sm",
            action: {
              type: "message",
              label: "คำสั่งเพิ่มเติม",
              text: "คำสั่งเพิ่มเติม",
            },
          },
          {
            type: "button",
            style: "link",
            margin: "sm",
            action: {
              type: "uri",
              label: "เข้าสู่ระบบ / สมัครสมาชิก",
              uri: "https://kanbann.bungkii.vercel.app/login",
            },
          },
        ],
      },
    },
  };
}

export function createVoteLeaderFlexMessage(candidates: { name: string }[]) {
  const buttons = candidates.map(candidate => ({
    type: "button",
    style: "primary",
    color: candidate.name === "งดออกเสียง" ? "#6B7280" : "#4F46E5",
    margin: "sm",
    action: {
      type: "message",
      label: candidate.name.substring(0, 20), // LINE label max length is 20
      text: `โหวตหัวหน้า: ${candidate.name}`,
    },
  }));

  return {
    type: "flex",
    altText: "โหวตเปลี่ยนหัวหน้า",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1E3A8A",
        contents: [
          {
            type: "text",
            text: "👑 โหวตหัวหน้าคนใหม่",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: "เลือกคนที่คุณต้องการให้เป็นหัวหน้า",
            color: "#BFDBFE",
            size: "sm",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: buttons,
      },
    },
  };
}

export function createCustomPollFlexMessage(pollId: string, question: string, options: string[], endTimeStr: string) {
  const endDate = new Date(endTimeStr);
  const endText = `ปิดโหวต: ${endDate.toLocaleDateString('th-TH', { dateStyle: 'short' })} เวลา ${endDate.toLocaleTimeString('th-TH', { timeStyle: 'short' })}`;

  const buttons = options.map((option, index) => ({
    type: "button",
    style: "primary",
    color: "#4F46E5",
    margin: "sm",
    action: {
      type: "message",
      label: option.substring(0, 40), // LINE label max 40 chars
      text: `โหวตโพล:${pollId}:${index}`,
    },
  }));

  return {
    type: "flex",
    altText: `โพลใหม่: ${question}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1E3A8A",
        contents: [
          {
            type: "text",
            text: "📊 โพลโหวต",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: endText,
            color: "#BFDBFE",
            size: "sm",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: question,
            weight: "bold",
            size: "md",
            wrap: true,
            color: "#111827",
            margin: "md",
          },
          ...buttons,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "ดูผลโหวต",
              text: `สรุปโพล:${pollId}`,
            },
          },
        ],
      },
    },
  };
}

export function createUniformFlexMessage(dayName: string, uniformName: string, themeColor: string, isFuture: boolean = false) {
  const headerText = isFuture ? "👗 เครื่องแบบ" : "👗 เครื่องแบบวันนี้";
  
  const contents: any[] = [
    {
      type: "text",
      text: uniformName,
      weight: "bold",
      size: "xl",
      color: "#111827",
      wrap: true,
      align: "center",
      margin: "md",
    },
  ];

  if (isFuture) {
    contents.push({
      type: "text",
      text: "(อาจมีการเปลี่ยนแปลง)",
      color: "#f59e0b",
      size: "sm",
      align: "center",
      margin: "md",
      weight: "bold"
    });
  }

  return {
    type: "flex" as const,
    altText: `ชุดที่ต้องใส่: ${uniformName}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: themeColor,
        contents: [
          {
            type: "text",
            text: headerText,
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: dayName,
            color: "#FFFFFF",
            size: "md",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: contents,
      },
    },
  };
}

export function createCleaningFlexMessage(dayName: string, cleaners: string) {
  return {
    type: "flex" as const,
    altText: `เวรทำความสะอาด: ${cleaners}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#10b981", // emerald-500
        contents: [
          {
            type: "text",
            text: "🧹 เวรทำความสะอาด",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: dayName,
            color: "#FFFFFF",
            size: "md",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: cleaners,
            weight: "bold",
            size: "lg",
            color: "#111827",
            wrap: true,
            align: "start",
            margin: "md",
          },
        ],
      },
    },
  };
}

export function createNextPeriodFlexMessage(period: number, subject: string, teacher: string, timeStr: string, isNext: boolean) {
  return {
    type: "flex" as const,
    altText: `คาบ${isNext ? 'ต่อไป' : 'นี้'}: ${subject}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#4f46e5", // indigo-600
        contents: [
          {
            type: "text",
            text: `📚 คาบ${isNext ? 'ต่อไป' : 'นี้'} (คาบ ${period})`,
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: timeStr,
            color: "#e0e7ff",
            size: "sm",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: subject,
            weight: "bold",
            size: "xl",
            color: "#111827",
            wrap: true,
          },
          {
            type: "text",
            text: `ครูผู้สอน: ${teacher || '-'}`,
            color: "#6b7280",
            size: "md",
            wrap: true,
          },
        ],
      },
    },
  };
}

export function createDailyScheduleFlexMessage(dayName: string, classes: {period: number, subject: string, teacher: string}[]) {
  const classBoxes = classes.map(c => ({
    type: "box",
    layout: "horizontal",
    margin: "md",
    contents: [
      {
        type: "text",
        text: `${c.period}`,
        color: "#9ca3af",
        size: "sm",
        flex: 1,
        align: "center",
        weight: "bold"
      },
      {
        type: "box",
        layout: "vertical",
        flex: 8,
        contents: [
          {
            type: "text",
            text: c.subject,
            weight: "bold",
            size: "sm",
            color: "#1f2937",
            wrap: true
          },
          {
            type: "text",
            text: c.teacher || '-',
            size: "xs",
            color: "#6b7280",
            wrap: true
          }
        ]
      }
    ]
  }));

  return {
    type: "flex" as const,
    altText: `ตารางเรียน: ${dayName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#4f46e5", // indigo-600
        contents: [
          {
            type: "text",
            text: "📅 ตารางเรียน",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: dayName,
            color: "#e0e7ff",
            size: "sm",
            margin: "sm",
          },
        ],
      },
        contents: [
          {
            type: "text",
            text: headerText,
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: dayName,
            color: "#FFFFFF",
            size: "md",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: contents,
      },
    },
  };
}

export function createCleaningFlexMessage(dayName: string, cleaners: string) {
  return {
    type: "flex" as const,
    altText: `เวรทำความสะอาด: ${cleaners}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#10b981", // emerald-500
        contents: [
          {
            type: "text",
            text: "🧹 เวรทำความสะอาด",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: dayName,
            color: "#FFFFFF",
            size: "md",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: cleaners,
            weight: "bold",
            size: "lg",
            color: "#111827",
            wrap: true,
            align: "start",
            margin: "md",
          },
        ],
      },
    },
  };
}

export function createNextPeriodFlexMessage(period: number, subject: string, teacher: string, timeStr: string, isNext: boolean) {
  return {
    type: "flex" as const,
    altText: `คาบ${isNext ? 'ต่อไป' : 'นี้'}: ${subject}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#4f46e5", // indigo-600
        contents: [
          {
            type: "text",
            text: `📚 คาบ${isNext ? 'ต่อไป' : 'นี้'} (คาบ ${period})`,
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: timeStr,
            color: "#e0e7ff",
            size: "sm",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: subject,
            weight: "bold",
            size: "xl",
            color: "#111827",
            wrap: true,
          },
          {
            type: "text",
            text: `ครูผู้สอน: ${teacher || '-'}`,
            color: "#6b7280",
            size: "md",
            wrap: true,
          },
        ],
      },
    },
  };
}

export function createDailyScheduleFlexMessage(dayName: string, classes: {period: number, subject: string, teacher: string}[]) {
  const classBoxes = classes.map(c => ({
    type: "box",
    layout: "horizontal",
    margin: "md",
    contents: [
      {
        type: "text",
        text: `${c.period}`,
        color: "#9ca3af",
        size: "sm",
        flex: 1,
        align: "center",
        weight: "bold"
      },
      {
        type: "box",
        layout: "vertical",
        flex: 8,
        contents: [
          {
            type: "text",
            text: c.subject,
            weight: "bold",
            size: "sm",
            color: "#1f2937",
            wrap: true
          },
          {
            type: "text",
            text: c.teacher || '-',
            size: "xs",
            color: "#6b7280",
            wrap: true
          }
        ]
      }
    ]
  }));

  return {
    type: "flex" as const,
    altText: `ตารางเรียน: ${dayName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#4f46e5", // indigo-600
        contents: [
          {
            type: "text",
            text: "📅 ตารางเรียน",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: dayName,
            color: "#e0e7ff",
            size: "sm",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: classBoxes,
      },
    },
  };
}

export function createFunnyFlexMessage(title: string, message: string, emoji: string = '✨', color: string = '#f59e0b') {
  const now = new Date();
  const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
  const dateString = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' });

  return {
    type: "flex" as const,
    altText: `${title}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: color,
        contents: [
          {
            type: "text",
            text: `${emoji} ${title}`,
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: message,
            wrap: true,
            size: "md",
            color: "#1f2937",
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "separator",
            color: "#e5e7eb"
          },
          {
            type: "text",
            text: `⏱️ ตอบกลับเรียลไทม์: ${dateString} ${timeString}`,
            color: "#9ca3af",
            size: "xs",
            align: "center",
            margin: "sm"
          }
        ]
      }
    }
  };
}
