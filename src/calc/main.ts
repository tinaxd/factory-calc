import { Item, Knowledge, KnowledgeJson } from "./models";
import { DotExporter, solve } from "./solver";

export function foo() {}

const knowledgeJson: KnowledgeJson = {
  recipes: [
    {
      inputs: [
        {
          item: "Iron Ingot",
          rate: 40,
        },
        {
          item: "Coal",
          rate: 40,
        },
      ],
      outputs: [
        {
          item: "Steel Ingot",
          rate: 60,
        },
      ],
    },
    {
      inputs: [
        {
          item: "Steel Ingot",
          rate: 30,
        },
      ],
      outputs: [
        {
          item: "Steel Pipe",
          rate: 20,
        },
      ],
    },
    {
      inputs: [
        {
          item: "Steel Pipe",
          rate: 15,
        },
        { item: "Copper Wire", rate: 40 },
      ],
      outputs: [{ item: "Stator", rate: 5 }],
    },
    {
      inputs: [
        { item: "Rotor", rate: 10 },
        { item: "Stator", rate: 10 },
      ],
      outputs: [{ item: "Motor", rate: 5 }],
    },
    {
      inputs: [
        { item: "Iron Rod", rate: 20 },
        { item: "Screw", rate: 100 },
      ],
      outputs: [{ item: "Rotor", rate: 4 }],
    },
    {
      inputs: [{ item: "Iron Ingot", rate: 15 }],
      outputs: [{ item: "Iron Rod", rate: 15 }],
    },
    {
      inputs: [{ item: "Iron Rod", rate: 10 }],
      outputs: [{ item: "Screw", rate: 40 }],
    },
    {
      inputs: [{ item: "Copper Ingot", rate: 15 }],
      outputs: [{ item: "Copper Wire", rate: 30 }],
    },
    {
      inputs: [],
      outputs: [{ item: "Iron Ingot", rate: 120 }],
    },
    {
      inputs: [],
      outputs: [{ item: "Coal", rate: 120 }],
    },
    {
      inputs: [],
      outputs: [{ item: "Copper Ingot", rate: 120 }],
    },
  ],
};

const knowledge = Knowledge.fromJson(knowledgeJson);

(async () => {
  const solution = await solve(knowledge, new Item("Motor"), 5);

  // console.log(JSON.stringify(solution, null, 2));

  const dotExporter = new DotExporter();
  const dot = dotExporter.toDot(solution);
  console.log(dot);
})();
