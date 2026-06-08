// search/trie.service.ts
export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd: boolean = false;
  symbols: Set<string> = new Set();
}

export class SymbolTrie {
  private root: TrieNode = new TrieNode();

  insert(symbol: string): void {
    let node = this.root;
    for (const char of symbol.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      node.symbols.add(symbol);
    }
    node.isEnd = true;
  }

  searchPrefix(prefix: string): string[] {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }
    return Array.from(node.symbols);
  }

  async loadFromDB(db: any): Promise<void> {
    const symbols = await db.Trade.findAll({
      attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('symbol')), 'symbol']],
      raw: true,
    });
    for (const row of symbols) {
      this.insert(row.symbol);
    }
  }
}