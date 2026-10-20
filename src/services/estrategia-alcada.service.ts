
export type Cargo = "VENDEDOR" | "SUPERVISOR" | "GERENTE";

export interface EstrategiaAlcada {
  validarDesconto(descontoPercentual: number): boolean;
}

export class EstrategiaVendedor implements EstrategiaAlcada {
  validarDesconto(descontoPercentual: number): boolean {
    return descontoPercentual <= 5;
  }
}

export class EstrategiaSupervisor implements EstrategiaAlcada {
  validarDesconto(descontoPercentual: number): boolean {
    return descontoPercentual <= 10;
  }
}

export class EstrategiaGerente implements EstrategiaAlcada {
  validarDesconto(_descontoPercentual: number): boolean {
    return true;
  }
}

export function obterEstrategiaAlcada(cargo: Cargo): EstrategiaAlcada {
  switch (cargo) {
    case "VENDEDOR":
      return new EstrategiaVendedor();

    case "SUPERVISOR":
      return new EstrategiaSupervisor();

    case "GERENTE":
      return new EstrategiaGerente();
  }
}
