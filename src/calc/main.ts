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
          item: "Iron Ore",
          rate: 45,
        },
        {
          item: "Coal",
          rate: 45,
        },
      ],
      outputs: [
        {
          item: "Steel Ingot",
          rate: 45,
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
        { item: "Wire", rate: 40 },
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
      outputs: [{ item: "Wire", rate: 30 }],
    },
    {
      inputs: [{ item: "Iron Ore", rate: 30 }],
      outputs: [{ item: "Iron Ingot", rate: 30 }],
    },
    {
      inputs: [],
      outputs: [{ item: "Coal", rate: 120 }],
    },
    {
      inputs: [{ item: "Copper Ore", rate: 30 }],
      outputs: [{ item: "Copper Ingot", rate: 30 }],
    },
    {
      inputs: [],
      outputs: [{ item: "Iron Ore", rate: 120 }],
    },
    {
      inputs: [],
      outputs: [{ item: "Copper Ore", rate: 120 }],
    },
    {
      inputs: [
        { item: "Automated Wiring", rate: 5 },
        { item: "Circuit Board", rate: 5 },
        { item: "Heavy Modular Frame", rate: 1 },
        {
          item: "Computer",
          rate: 2,
        },
      ],
      outputs: [{ item: "Adaptive Control Unit", rate: 1 }],
    },
    {
      inputs: [{ item: "Wire", rate: 60 }],
      outputs: [{ item: "Cable", rate: 30 }],
    },
    {
      inputs: [
        { item: "Stator", rate: 2.5 },
        { item: "Cable", rate: 50 },
      ],
      outputs: [{ item: "Automated Wiring", rate: 2.5 }],
    },
    {
      inputs: [{ item: "Copper Ingot", rate: 20 }],
      outputs: [{ item: "Copper Sheet", rate: 10 }],
    },
    {
      inputs: [
        { item: "Copper Sheet", rate: 15 },
        {
          item: "Plastic",
          rate: 30,
        },
      ],
      outputs: [{ item: "Circuit Board", rate: 7.5 }],
    },
    {
      inputs: [{ item: "Crude Oil", rate: 30 }],
      outputs: [
        { item: "Plastic", rate: 20 },
        { item: "Heavy Oil Residue", rate: 10 },
      ],
    },
    {
      inputs: [
        { item: "Circuit Board", rate: 10 },
        { item: "Cable", rate: 20 },
        { item: "Plastic", rate: 40 },
      ],
      outputs: [{ item: "Computer", rate: 2.5 }],
    },
    {
      inputs: [{ item: "Iron Ingot", rate: 30 }],
      outputs: [{ item: "Iron Plate", rate: 20 }],
    },
    {
      inputs: [
        { item: "Iron Plate", rate: 30 },
        { item: "Screw", rate: 60 },
      ],
      outputs: [{ item: "Reinforced Iron Plate", rate: 5 }],
    },
    {
      inputs: [
        { item: "Reinforced Iron Plate", rate: 3 },
        { item: "Iron Rod", rate: 12 },
      ],
      outputs: [{ item: "Modular Frame", rate: 2 }],
    },
    {
      inputs: [{ item: "Steel Ingot", rate: 60 }],
      outputs: [{ item: "Steel Beam", rate: 15 }],
    },
    {
      inputs: [{ item: "Limestone", rate: 3 }],
      outputs: [{ item: "Concrete", rate: 15 }],
    },
    { inputs: [], outputs: [{ item: "Limestone", rate: 120 }] },
    {
      inputs: [
        { item: "Steel Beam", rate: 18 },
        { item: "Concrete", rate: 36 },
      ],
      outputs: [{ item: "Encased Industrial Beam", rate: 6 }],
    },
    {
      inputs: [
        { item: "Steel Pipe", rate: 24 },
        { item: "Concrete", rate: 20 },
      ],
      outputs: [{ item: "Encased Industrial Beam", rate: 4 }],
    },
    {
      inputs: [
        { item: "Modular Frame", rate: 10 },
        { item: "Steel Pipe", rate: 40 },
        { item: "Encased Industrial Beam", rate: 10 },
        { item: "Screw", rate: 240 },
      ],
      outputs: [{ item: "Heavy Modular Frame", rate: 2 }],
    },
    {
      inputs: [],
      outputs: [{ item: "Crude Oil", rate: 60 }],
    },
    {
      inputs: [{ item: "Crude Oil", rate: 30 }],
      outputs: [
        { item: "Rubber", rate: 20 },
        { item: "Heavy Oil Residue", rate: 20 },
      ],
    },
    {
      inputs: [
        { item: "Reinforced Iron Plate", rate: 2 },
        { item: "Rotor", rate: 2 },
      ],
      outputs: [{ item: "Smart Plating", rate: 2 }],
    },
    {
      inputs: [
        { item: "Motor", rate: 2 },
        { item: "Rubber", rate: 15 },
        { item: "Smart Plating", rate: 2 },
      ],
      outputs: [{ item: "Modular Engine", rate: 1 }],
    },
    // {
    //   inputs: [],
    //   outputs: [
    //     { item: "Iron Ore", rate: 120 },
    //     { item: "Copper Ore", rate: 60 },
    //   ],
    // }
  ],
  weights: [
    // {
    //   item: "Iron Ore",
    //   weight: 100,
    // },
  ],
};

// find items which are only appear in inputs
const items = new Set<string>();
knowledgeJson.recipes.forEach((recipe) => {
  recipe.inputs.forEach((input) => {
    items.add(input.item);
  });
});
knowledgeJson.recipes.forEach((recipe) => {
  recipe.outputs.forEach((output) => {
    items.delete(output.item);
  });
});
console.log(items);

const knowledge = Knowledge.fromJson(knowledgeJson);

(async () => {
  const solution = await solve(knowledge, new Item("Modular Engine"), 5);

  // console.log(JSON.stringify(solution, null, 2));

  const dotExporter = new DotExporter();
  const dot = dotExporter.toDot(solution);
  console.log(dot);
})();
