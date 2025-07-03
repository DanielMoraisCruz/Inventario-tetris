import csv
import json
import os

# Caminhos dos arquivos
# Usa o diretório do próprio script para localizar o CSV corretamente
caminho_csv = os.path.join(os.path.dirname(__file__), 'CSV-itens.csv')
caminho_json = os.path.join(os.path.dirname(__file__), 'items.json')  # arquivo JSON gerado


def carregar_csv_para_lista(caminho):
    with open(caminho, mode='r', encoding='utf-8') as f:
        leitor = csv.DictReader(f)
        return [
            {
                "nome": linha["nome"],
                "width": int(linha["width"]),
                "height": int(linha["height"]),
                "color": linha["color"],
                "img": linha.get("img", "")
            }
            for linha in leitor
        ]


def atualizar_arquivo_json(caminho, novos_itens):
    # Se o arquivo existir, tenta carregar o conteúdo anterior
    if os.path.exists(caminho):
        with open(caminho, mode='r', encoding='utf-8') as f:
            try:
                conteudo = json.load(f)
            except json.JSONDecodeError:
                conteudo = []
    else:
        conteudo = []

    # Substituir todos os itens (ou você pode fazer merge se quiser)
    conteudo = novos_itens

    with open(caminho, mode='w', encoding='utf-8') as f:
        json.dump(conteudo, f, indent=2, ensure_ascii=False)
    print(f"Arquivo '{caminho}' atualizado com {len(novos_itens)} itens.")


# Execução
itens_csv = carregar_csv_para_lista(caminho_csv)
atualizar_arquivo_json(caminho_json, itens_csv)
