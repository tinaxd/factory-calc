export class Item {
  constructor(public name: string) {}

  equals(other: Item): boolean {
    return this.name === other.name;
  }
}

export class RecipeComponent {
  constructor(public item: Item, public rate: number) {}

  toJson() {
    return {
      item: this.item.name,
      rate: this.rate,
    };
  }
}

export class Recipe {
  id: number;
  private static nextId = 0;

  constructor(
    public inputs: RecipeComponent[],
    public outputs: RecipeComponent[]
  ) {
    this.id = Recipe.nextId++;
  }

  outputRateOf(item: Item): number {
    for (const output of this.outputs) {
      if (output.item.equals(item)) {
        return output.rate;
      }
    }

    throw new Error(`No output found for ${item.name}`);
  }

  toJson() {
    return {
      inputs: this.inputs.map((i) => i.toJson()),
      outputs: this.outputs.map((o) => o.toJson()),
    };
  }

  static fromJson(j: {
    inputs: { item: string; rate: number }[];
    outputs: { item: string; rate: number }[];
  }): Recipe {
    return new Recipe(
      j["inputs"].map(
        (i) => new RecipeComponent(new Item(i["item"]), i["rate"])
      ),
      j["outputs"].map(
        (o) => new RecipeComponent(new Item(o["item"]), o["rate"])
      )
    );
  }
}

export class Knowledge {
  constructor(public recipes: Recipe[]) {}

  findRecipesWithOutput(item: Item): Recipe[] {
    return this.recipes.filter((recipe) => {
      return recipe.outputs.some((o) => {
        return o.item.equals(item);
      });
    });
  }

  static fromJson(j: KnowledgeJson): Knowledge {
    return new Knowledge(
      j["recipes"].map((r) => {
        return new Recipe(
          r["inputs"].map(
            (i) => new RecipeComponent(new Item(i["item"]), i["rate"])
          ),
          r["outputs"].map(
            (o) => new RecipeComponent(new Item(o["item"]), o["rate"])
          )
        );
      })
    );
  }
}

export type KnowledgeJson = {
  recipes: Parameters<typeof Recipe.fromJson>[0][];
};
