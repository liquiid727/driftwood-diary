export const templatePacks = [
  {
    id: "graduation-pack",
    title: "毕业季主题包",
    description: "同学录封面、时间轴、留言墙、老师寄语页。",
    layouts: ["封面合影", "成长时间轴", "留言墙", "寄语页"],
  },
  {
    id: "spring-pack",
    title: "中国新年主题包",
    description: "团圆合影、年夜饭记录、拜年页、红包页。",
    layouts: ["团圆封面", "年夜饭", "拜年页", "红包页"],
  },
  {
    id: "story-pack",
    title: "通用故事模板",
    description: "留白叙事、电影海报、风格拼贴、合影中心型。",
    layouts: ["留白叙事", "电影海报", "风格拼贴", "合影中心"],
  },
];

import type { Layout } from "@/types/core";

export const templateLayouts: Layout[] = [
  {
    id: "layout-nine-grid",
    name: "九宫格",
    cols: 3,
    rows: 3,
    regions: Array.from({ length: 9 }).map((_, index) => {
      const x = index % 3;
      const y = Math.floor(index / 3);
      return {
        id: `region-${index + 1}`,
        order: index + 1,
        cells: [[x, y]],
      };
    }),
  },
  {
    id: "layout-center-focus",
    name: "中心合影",
    cols: 4,
    rows: 4,
    regions: [
      { id: "region-1", order: 1, cells: [[1, 1], [1, 2], [2, 1], [2, 2]] },
      { id: "region-2", order: 2, cells: [[0, 0], [0, 1]] },
      { id: "region-3", order: 3, cells: [[3, 0], [3, 1]] },
      { id: "region-4", order: 4, cells: [[0, 2], [0, 3]] },
      { id: "region-5", order: 5, cells: [[3, 2], [3, 3]] },
    ],
  },
  {
    id: "layout-heart",
    name: "空心爱心",
    cols: 7,
    rows: 7,
    regions: [
      {
        id: "region-1",
        order: 1,
        cells: [
          [1, 0],
          [2, 0],
          [4, 0],
          [5, 0],
          [0, 1],
          [3, 1],
          [6, 1],
          [0, 2],
          [6, 2],
          [1, 3],
          [5, 3],
          [2, 4],
          [4, 4],
          [3, 5],
          [3, 6],
        ],
      },
    ],
  },
];
