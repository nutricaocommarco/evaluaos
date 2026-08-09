# -*- coding: utf-8 -*-
"""
Converte a "Pesquisa de Orcamentos Familiares 2008-2009: Tabelas de
Composicao Nutricional dos Alimentos Consumidos no Brasil" (IBGE, 2011)
num .sql de INSERT pra tabela_alimentos, mesmo fluxo do importador da TACO.

Fonte: https://biblioteca.ibge.gov.br/visualizacao/livros/liv50002.pdf
(publicacao do IBGE, sem restricao de reproducao encontrada, diferente da TBCA)

O PDF tem 4 sub-tabelas de dados, cada uma com as MESMAS combinacoes
alimento+preparo, nas mesmas paginas relativas (61 paginas cada):
  Tabela 1 (energia/macros/fibra), Tabela 2 (colesterol/AG/acucar),
  Tabela 3 (minerais), Tabela 4 (vitaminas).
Juntamos as 4 pelo par (codigo_alimento, codigo_preparo).

Uso:
  python scripts/importar_ibge_pof.py "<caminho-para-liv50002.pdf>"

Gera scripts/tabela_alimentos_ibge.sql
"""

import sys
import re
import os

try:
    import fitz  # pymupdf
except ImportError:
    print("Precisa do pymupdf: pip install pymupdf")
    sys.exit(1)

RE_COD_ALIMENTO = re.compile(r'^\d{6,7}$')
RE_COD_PREPARO = re.compile(r'^\d{1,2}$')


def parse_valor(s):
    s = s.strip()
    if s in ('-',):
        return 0.0
    if s in ('..', '...', 'x', 'X', ''):
        return None
    s = s.replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return None


def extrair_linhas(doc, pagina_ini_0idx, pagina_fim_0idx):
    linhas = []
    for i in range(pagina_ini_0idx, pagina_fim_0idx + 1):
        texto = doc[i].get_text()
        linhas.extend(texto.split('\n'))
    return linhas


def parse_tabela(linhas, n_valores):
    """
    Retorna lista de dicts: {codigo_alimento, nome_alimento, codigo_preparo,
    nome_preparo, valores: [...]}

    Nota: diferente da TACO, nao extraimos "categoria" daqui — a legenda
    "Tabela N - ..." + nome da categoria so aparece no rodape de paginas
    onde a categoria MUDOU desde a pagina anterior (nem toda pagina repete),
    o que tornou a deteccao por posicao pouco confiavel (chegou a pegar
    nome de alimento de outra secao como se fosse categoria). Categoria e
    so um rotulo cosmetico — preferimos deixar null a arriscar errado.
    """
    resultados = []

    i = 0
    n = len(linhas)
    while i < n:
        linha = linhas[i].strip()

        if linha.startswith('Tabela ') and ' - ' in linha:
            i += 1
            continue

        if not RE_COD_ALIMENTO.match(linha):
            i += 1
            continue

        codigo_alimento = linha
        i += 1

        nome_partes = []
        while i < n and not RE_COD_PREPARO.match(linhas[i].strip()):
            texto = linhas[i].strip()
            if texto:
                nome_partes.append(texto)
            i += 1
            if i >= n:
                break
        if i >= n:
            break
        codigo_preparo = linhas[i].strip()
        i += 1

        if i >= n:
            break
        nome_preparo = linhas[i].strip()
        i += 1

        valores = []
        while len(valores) < n_valores and i < n:
            valores.append(parse_valor(linhas[i]))
            i += 1

        if len(valores) < n_valores:
            break

        resultados.append({
            'codigo_alimento': codigo_alimento,
            'nome_alimento': ' '.join(nome_partes).strip(),
            'codigo_preparo': codigo_preparo,
            'nome_preparo': nome_preparo,
            'valores': valores,
        })

    return resultados


def sql_string(v):
    if v is None or v == '':
        return 'null'
    return "'" + str(v).replace("'", "''").strip() + "'"


def sql_number(v):
    return 'null' if v is None else v


def main():
    if len(sys.argv) < 2:
        print('Uso: python scripts/importar_ibge_pof.py "<caminho-para-liv50002.pdf>"')
        sys.exit(1)

    caminho = sys.argv[1]
    print(f'Lendo {caminho}...')
    doc = fitz.open(caminho)

    # paginas 0-indexed, confirmadas por inspecao do PDF
    faixas = {
        1: (35, 95, 5),
        2: (96, 156, 9),
        3: (157, 217, 11),
        4: (218, 278, 12),
    }

    tabelas = {}
    for num, (ini, fim, n_val) in faixas.items():
        linhas = extrair_linhas(doc, ini, fim)
        linhas = [
            l for l in linhas
            if l.strip() != ''
            and 'Pesquisa de Or' not in l
            and 'Tabelas de Composi' not in l
            and 'continua' not in l.lower()
        ]
        parsed = parse_tabela(linhas, n_val)
        tabelas[num] = {(r['codigo_alimento'], r['codigo_preparo']): r for r in parsed}
        print(f'Tabela {num}: {len(parsed)} linhas')

    base = tabelas[1]
    print(f'Base (Tabela 1): {len(base)} combinacoes alimento+preparo')

    alimentos = []
    faltando_2 = faltando_3 = faltando_4 = 0

    for chave, r1 in base.items():
        r2 = tabelas[2].get(chave)
        r3 = tabelas[3].get(chave)
        r4 = tabelas[4].get(chave)
        if r2 is None:
            faltando_2 += 1
        if r3 is None:
            faltando_3 += 1
        if r4 is None:
            faltando_4 += 1

        v1 = r1['valores']
        v2 = r2['valores'] if r2 else [None] * 9
        v3 = r3['valores'] if r3 else [None] * 11
        v4 = r4['valores'] if r4 else [None] * 12

        nome = r1['nome_alimento']
        if r1['nome_preparo'] and r1['nome_preparo'] != 'Não se aplica':
            nome = f"{nome}, {r1['nome_preparo']}"

        alimentos.append({
            'nome': nome,
            'categoria': None,
            'energia_kcal': v1[0],
            'proteina_g': v1[1],
            'lipidios_g': v1[2],
            'carboidrato_g': v1[3],
            'fibra_g': v1[4],
            'colesterol_mg': v2[0],
            'gorduras_saturadas_g': v2[1],
            'gorduras_trans_g': v2[6],
            'acucares_g': v2[7],
            'calcio_mg': v3[0],
            'ferro_mg': v3[4],
            'sodio_mg': v3[5],
            'zinco_mg': v3[9],
            'vitamina_a_mcg': v4[1],
            'tiamina_mg': v4[2],
            'riboflavina_mg': v4[3],
            'niacina_mg': v4[4],
            'vitamina_b6_mg': v4[6],
            'vitamina_b12_mcg': v4[7],
            'vitamina_d_mcg': v4[9],
            'vitamina_c_mg': v4[11],
        })

    print(f'Faltando na Tabela 2: {faltando_2} | Tabela 3: {faltando_3} | Tabela 4: {faltando_4}')
    print(f'Total de alimentos convertidos: {len(alimentos)}')
    print('Amostra:')
    for a in alimentos[:5]:
        print(f"  - {a['nome']} - {a['energia_kcal']} kcal, {a['proteina_g']}g proteina")

    colunas = [
        'nome', 'categoria', 'fonte', 'id_avaliador',
        'energia_kcal', 'proteina_g', 'lipidios_g', 'carboidrato_g', 'fibra_g',
        'colesterol_mg', 'calcio_mg', 'ferro_mg', 'sodio_mg', 'zinco_mg',
        'vitamina_a_mcg', 'vitamina_c_mg', 'vitamina_d_mcg', 'tiamina_mg',
        'riboflavina_mg', 'niacina_mg', 'vitamina_b6_mg', 'vitamina_b12_mcg',
        'gorduras_saturadas_g', 'gorduras_trans_g', 'acucares_g',
    ]

    linhas_sql = []
    for a in alimentos:
        valores = [
            sql_string(a['nome']), sql_string(a['categoria']), "'IBGE'", 'null',
            sql_number(a['energia_kcal']), sql_number(a['proteina_g']),
            sql_number(a['lipidios_g']), sql_number(a['carboidrato_g']),
            sql_number(a['fibra_g']), sql_number(a['colesterol_mg']),
            sql_number(a['calcio_mg']), sql_number(a['ferro_mg']),
            sql_number(a['sodio_mg']), sql_number(a['zinco_mg']),
            sql_number(a['vitamina_a_mcg']), sql_number(a['vitamina_c_mg']),
            sql_number(a['vitamina_d_mcg']), sql_number(a['tiamina_mg']),
            sql_number(a['riboflavina_mg']), sql_number(a['niacina_mg']),
            sql_number(a['vitamina_b6_mg']), sql_number(a['vitamina_b12_mcg']),
            sql_number(a['gorduras_saturadas_g']), sql_number(a['gorduras_trans_g']),
            sql_number(a['acucares_g']),
        ]
        linhas_sql.append('  (' + ', '.join(str(v) for v in valores) + ')')

    corpo_values = ',\n'.join(linhas_sql)
    lista_colunas = ', '.join(colunas)
    sql = (
        "-- Import da tabela do IBGE (POF 2008-2009): Tabelas de Composicao\n"
        "-- Nutricional dos Alimentos Consumidos no Brasil.\n"
        f"-- Gerado automaticamente por scripts/importar_ibge_pof.py. {len(alimentos)} alimentos.\n"
        "--\n"
        "-- id_avaliador fica null (alimento oficial, visivel a todos os avaliadores).\n"
        "-- Cobre variantes de preparo (cru/cozido/grelhado/assado/etc.) como linhas\n"
        "-- separadas, mesmo padrao da TACO.\n\n"
        f"insert into public.tabela_alimentos ({lista_colunas}) values\n"
        f"{corpo_values};\n"
    )

    saida = os.path.join(os.path.dirname(__file__), 'tabela_alimentos_ibge.sql')
    with open(saida, 'w', encoding='utf-8') as f:
        f.write(sql)
    print(f'Arquivo gerado: {saida}')


if __name__ == '__main__':
    main()
