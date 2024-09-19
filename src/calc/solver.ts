import { Item, Knowledge, Recipe } from "./models";
import GLPK from "glpk.js";

const glpk = GLPK();

export type ChainNode = DeterminedChainNode | UnderdeterminedChainNode;

type DeterminedChainNodeJson = {
  inputs: {
    edges: ReturnType<ChainEdge["toJson"]>[];
    node:
      | ReturnType<UnderdeterminedChainNode["toJson"]>
      | DeterminedChainNodeJson;
  }[];
};

export class DeterminedChainNode {
  constructor(
    public inputs: [ChainEdge[], ChainNode][],
    public recipe: Recipe
  ) {}

  toJson(): DeterminedChainNodeJson {
    return {
      inputs: this.inputs.map((input) => {
        return {
          edges: input[0].map((edge) => edge.toJson()),
          node: input[1].toJson(),
        };
      }),
    };
  }
}

export class UnderdeterminedChainNode {
  constructor(public possibleRecipes: Recipe[]) {}

  toJson() {
    return {
      possibleRecipes: this.possibleRecipes.map((recipe) => recipe.toJson()),
    };
  }
}

export class ChainEdge {
  constructor(public flow: [Item, number]) {}

  toJson() {
    return {
      item: this.flow[0].name,
      rate: this.flow[1],
    };
  }
}

function makeDirectChain(
  knowledge: Knowledge,
  targetItem: Item,
  targetRate: number
): ChainNode {
  const recipes = knowledge.findRecipesWithOutput(targetItem);

  if (recipes.length === 0) {
    throw new Error(`No recipe found for ${targetItem.name}`);
  }

  if (recipes.length > 1) {
    return new UnderdeterminedChainNode(recipes);
  }

  const recipe = recipes[0];
  const inputNodes: [ChainEdge[], ChainNode][] = [];
  for (const ingredient of recipe.inputs) {
    const ingredientRate =
      (targetRate / recipe.outputRateOf(targetItem)) * ingredient.rate;
    const ingredientNode = makeDirectChain(
      knowledge,
      ingredient.item,
      ingredientRate
    );
    const ingredientEdge = new ChainEdge([ingredient.item, ingredientRate]);
    inputNodes.push([[ingredientEdge], ingredientNode]);
  }

  return new DeterminedChainNode(inputNodes, recipe);
}

type ProblemConfig = {
  variables: Record<string, Recipe>;
  st: { st: Record<string, number>; lb: number }[]; // subject to
  constraints: Record<string, { lb: number }>;
  objective: { coeff: Record<string, number>; direction: "max" | "min" };
};

export function makeTableau(
  knowledge: Knowledge,
  target: { item: Item; rate: number }
): ProblemConfig {
  const variables: Record<string, Recipe> = {};
  const constraints: Record<string, { lb: number }> = {};

  const itemIds: Record<string, number> = {}; // item name -> index in subjectTos
  const subjectTos: { st: Record<string, number>; lb: number }[] = [];
  const itemConsumptions: { recipeVariable: string; coeff: number }[][] = [];
  const itemWeights: number[] = [];
  const getItemId = (item: Item) => {
    if (itemIds[item.name] === undefined) {
      itemIds[item.name] = subjectTos.length;
      subjectTos.push({ st: {}, lb: 0 });
      itemConsumptions.push([]);
      itemWeights.push(1);
    }
    return itemIds[item.name];
  };

  for (let i = 0; i < knowledge.recipes.length; i++) {
    const recipe = knowledge.recipes[i];
    const recipeVariable = `x${i}`;

    variables[recipeVariable] = recipe;

    for (const input of recipe.inputs) {
      const itemId = getItemId(input.item);
      subjectTos[itemId].st[recipeVariable] = -input.rate;
      constraints[recipeVariable] = { lb: 0 };
      itemConsumptions[itemId].push({
        recipeVariable: recipeVariable,
        coeff: input.rate,
      });
    }
    for (const output of recipe.outputs) {
      const itemId = getItemId(output.item);
      subjectTos[itemId].st[recipeVariable] = output.rate;
      constraints[recipeVariable] = { lb: 0 };
      itemConsumptions[itemId].push({
        recipeVariable: recipeVariable,
        coeff: -output.rate,
      });
    }
  }

  const objectiveCoeffs: Record<string, number> = {};
  for (let i = 0; i < itemWeights.length; i++) {
    for (const consumption of itemConsumptions[i]) {
      objectiveCoeffs[consumption.recipeVariable] =
        (objectiveCoeffs[consumption.recipeVariable] || 0) +
        itemWeights[i] * consumption.coeff;
    }
  }

  // set target
  const targetItemId = getItemId(target.item);
  subjectTos[targetItemId].lb = target.rate;

  return {
    variables,
    st: subjectTos,
    constraints,
    objective: {
      coeff: objectiveCoeffs,
      direction: "min",
    },
  };
}

async function optimize(config: ProblemConfig) {
  const solution = await (glpk.solve(
    {
      name: "LP",
      objective: {
        direction:
          config.objective.direction === "max" ? glpk.GLP_MAX : glpk.GLP_MIN,
        name: "obj",
        vars: Object.keys(config.objective.coeff).map((variable) => {
          return {
            name: variable,
            coef: config.objective.coeff[variable],
          };
        }),
      },
      subjectTo: config.st.map((st, idx) => {
        return {
          name: `recipe${idx}`,
          vars: Object.keys(st.st).map((v) => {
            return {
              name: v,
              coef: st.st[v],
            };
          }),
          bnds: {
            type: glpk.GLP_LO,
            lb: st.lb,
            ub: 0.0, // ignored
          },
        };
      }),
      bounds: Object.keys(config.constraints).map((variable) => {
        const constraint = config.constraints[variable];
        return {
          name: variable,
          type: glpk.GLP_LO,
          lb: constraint.lb,
          ub: 0.0, // ignored
        };
      }),
    },
    {
      // msglev: glpk.GLP_MSG_ALL,
      presol: true,
      cb: {
        call: (progress) => console.log(progress),
        each: 1,
      },
    }
  ) as unknown as Promise<ReturnType<(typeof glpk)["solve"]>>); // typing is wrong

  // library bug?
  // await new Promise((resolve) => setTimeout(resolve, 500));

  const ret: Solution = { recipes: [] };
  console.log("config", config);
  console.log("solution", solution);
  for (const variable in config.variables) {
    console.log("variable: ", variable);
    const value = solution.result.vars[variable];
    console.log("value: ", value);
    if (value > 0) {
      ret.recipes.push({ recipe: config.variables[variable], scale: value });
    }
  }

  return ret;
}

export async function solve(
  knowledge: Knowledge,
  targetItem: Item,
  targetRate: number
): Promise<Solution> {
  const tab = makeTableau(knowledge, { item: targetItem, rate: targetRate });
  return await optimize(tab);
}

export type Solution = {
  recipes: {
    recipe: Recipe;
    scale: number;
  }[];
};

export class DotExporter {
  private id: number = 0;
  private line: string = "";

  constructor() {}

  private generateId() {
    return this.id++;
  }

  private generateNodeId() {
    return `node${this.generateId()}`;
  }

  toDot(solution: Solution): string {
    if (this.line !== "") {
      throw new Error("DotExporter instance is not reusable");
    }

    this.line += "digraph G {\n";

    this.renderSolution(solution);

    this.line += "}\n";

    return this.line;
  }

  private renderSolution(solution: Solution) {
    const requirements: Record<string, number>[] = [];
    const productions: Record<string, number>[] = [];
    const nodeIds: string[] = [];
    for (let i = 0; i < solution.recipes.length; i++) {
      const recipe = solution.recipes[i];
      const thisNodeId = this.generateNodeId();
      const node = recipe;
      const thisNodeLabel =
        (node.recipe.inputs.length === 0
          ? "(no input)"
          : node.recipe.inputs.map((i) => i.item.name).join(", ")) +
        "\\nto\\n" +
        (node.recipe.outputs.length === 0
          ? "(no output)"
          : node.recipe.outputs.map((o) => o.item.name).join(", "));
      this.line += `${thisNodeId} [label = "${thisNodeLabel}"]\n`;

      const req: Record<string, number> = {};
      for (const input of recipe.recipe.inputs) {
        const requiredRate = input.rate * recipe.scale;
        req[input.item.name] = requiredRate;
      }
      requirements.push(req);

      const prod: Record<string, number> = {};
      for (const output of recipe.recipe.outputs) {
        const producedRate = output.rate * recipe.scale;
        prod[output.item.name] = producedRate;
      }
      productions.push(prod);

      nodeIds.push(thisNodeId);
    }

    const tol = 0.001;
    const fulfilled = () => {
      for (const req of requirements) {
        for (const item in req) {
          if (req[item] > tol) {
            // console.log("req[item]", req[item], "item", item);
            return false;
          }
        }
      }
      return true;
    };

    while (!fulfilled()) {
      for (let reqId = 0; reqId < requirements.length; reqId++) {
        const req = requirements[reqId];
        for (const item in req) {
          if (req[item] <= tol) {
            continue;
          }

          // find producer
          while (req[item] > tol) {
            let producerIdx = -1;
            let itemFlow: number;
            for (let i = 0; i < productions.length; i++) {
              if (productions[i][item] > tol) {
                producerIdx = i;
                itemFlow = Math.min(productions[i][item], req[item]);
                req[item] -= itemFlow;
                break;
              }
            }

            if (producerIdx === -1) {
              throw new Error(`No producer found for ${item}`);
            }

            const producerNodeId = nodeIds[producerIdx];
            const consumerNodeId = nodeIds[reqId];
            const label = `${item} ${parseFloat(itemFlow!.toFixed(2))}`;
            this.line += `${producerNodeId} -> ${consumerNodeId} [label = "${label}"]\n`;
            // console.log("fulfilled: ", label);
          }
        }
      }
    }

    // for (const [edges, prevNode] of node.inputs) {
    //   const prevNodeDot = this.renderNode(prevNode);

    //   for (const edge of edges) {
    //     const edgeLabel =
    //       edge.flow[0].name + " " + parseFloat(edge.flow[1].toFixed(2));
    //     this.line += `${prevNodeDot.nodeId} -> ${thisNodeId} [label = "${edgeLabel}"]\n`;
    //   }
    // }
  }
}
