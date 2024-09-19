import { Item, Knowledge, Recipe } from "./models";

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

export function solve(
  knowledge: Knowledge,
  targetItem: Item,
  targetRate: number
) {
  const chain = makeDirectChain(knowledge, targetItem, targetRate);
  return chain;
}

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

  toDot(node: ChainNode): string {
    if (this.line !== "") {
      throw new Error("DotExporter instance is not reusable");
    }

    this.line += "digraph G {\n";

    this.renderNode(node);

    this.line += "}\n";

    return this.line;
  }

  private renderNode(node: ChainNode): { nodeId: string } {
    if (node instanceof DeterminedChainNode) {
      const thisNodeId = this.generateNodeId();
      const thisNodeLabel =
        (node.recipe.inputs.length === 0
          ? "(no input)"
          : node.recipe.inputs.map((i) => i.item.name).join(", ")) +
        "\\nto\\n" +
        (node.recipe.outputs.length === 0
          ? "(no output)"
          : node.recipe.outputs.map((o) => o.item.name).join(", "));

      this.line += `${thisNodeId} [label = "${thisNodeLabel}"]\n`;

      for (const [edges, prevNode] of node.inputs) {
        const prevNodeDot = this.renderNode(prevNode);

        for (const edge of edges) {
          const edgeLabel =
            edge.flow[0].name + " " + parseFloat(edge.flow[1].toFixed(2));
          this.line += `${prevNodeDot.nodeId} -> ${thisNodeId} [label = "${edgeLabel}"]\n`;
        }
      }

      return {
        nodeId: thisNodeId,
      };
    } else {
      throw new Error("Not implemented");
    }
  }
}
