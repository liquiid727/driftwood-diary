export type ThemeKey = "forest" | "graduation" | "springFestival";

export const themes: Record<
  ThemeKey,
  {
    name: string;
    description: string;
    palette: string[];
    highlights: string[];
    services: string[];
    stickerKeywords: string[];
    pageGuides: string[];
  }
> = {
  forest: {
    name: "森系岛屿",
    description: "奶油底色配森林绿与淡雾蓝，温柔、治愈、像岛民日记。",
    palette: ["#E9E4D4", "#B7D89F", "#C7B2DD", "#6FC9FF"],
    highlights: ["岛民日记", "柔光拼贴", "森系贴纸"],
    services: ["一键标题", "氛围语录", "色调推荐"],
    stickerKeywords: ["叶子", "木牌", "布纹", "小花"],
    pageGuides: ["封面页", "日常记录页", "心情语录页", "合集页"],
  },
  graduation: {
    name: "青春毕业季",
    description: "明亮蓝紫与暖米白的青春气息，点缀一点热烈感，适合学生与留念场景。",
    palette: ["#7FCBFF", "#F8F4EE", "#CBB7FF", "#5B6CFF"],
    highlights: ["签名墙", "成长时间轴", "老师寄语"],
    services: ["一键寄语", "班级口号生成", "同学留言卡"],
    stickerKeywords: ["胶带", "手写涂鸦", "拍立得", "便签贴纸"],
    pageGuides: ["封面合影页", "成长时间轴页", "留言墙页", "老师寄语页"],
  },
  springFestival: {
    name: "中国新年",
    description: "朱红与金色为主，暖黑压稳，营造喜庆、热闹、红火、团圆的节日氛围。",
    palette: ["#C81E1E", "#F5C542", "#2B1C12", "#FFF4E6"],
    highlights: ["拜年页", "年夜饭记录", "红包页"],
    services: ["祝福语模板", "家人称呼位", "年味标题库"],
    stickerKeywords: ["灯笼", "窗花", "福字", "祥云"],
    pageGuides: ["团圆合影页", "年夜饭页", "拜年页", "红包页"],
  },
};
