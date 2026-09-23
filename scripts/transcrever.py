r"""Transcreve audio (WhatsApp .ogg, .mp3, .m4a, .wav) localmente - o arquivo nunca sai da maquina.

Uso (PowerShell ou bash), passando um ou varios arquivos:

    py -3.12 scripts/transcrever.py "C:\Users\Acer\Downloads\WhatsApp Ptt ....ogg"

Se `py` nao existir, chame o Python 3.12 direto (e o que tem a biblioteca):

    "C:\Users\Acer\AppData\Local\Programs\Python\Python312\python.exe" scripts/transcrever.py <audio>

Opcoes:
    --modelo tiny|base|small|medium|large-v3   (padrao: small - bom equilibrio)
    --idioma pt                                 (padrao: pt)
    --sem-arquivo                               (so mostra na tela, nao salva .txt)

O texto sai na tela E num .txt ao lado do audio (mesmo nome, extensao .txt),
porque o terminal do Windows costuma estragar os acentos.
"""

import argparse
import sys
from pathlib import Path

PYTHON_COM_A_LIB = r"C:\Users\Acer\AppData\Local\Programs\Python\Python312\python.exe"


def carregar_modelo(nome: str):
    try:
        from faster_whisper import WhisperModel
    except ModuleNotFoundError:
        print(
            "faster-whisper nao esta neste Python.\n"
            f"Rode com o Python que tem a biblioteca:\n  \"{PYTHON_COM_A_LIB}\" scripts/transcrever.py <audio>\n"
            "Ou instale aqui:  pip install faster-whisper",
            file=sys.stderr,
        )
        raise SystemExit(1)
    # int8 na CPU: roda em qualquer maquina, sem placa de video.
    return WhisperModel(nome, device="cpu", compute_type="int8")


def main() -> None:
    p = argparse.ArgumentParser(description="Transcreve audios localmente com faster-whisper.")
    p.add_argument("audios", nargs="+", help="Arquivos de audio")
    p.add_argument("--modelo", default="small")
    p.add_argument("--idioma", default="pt")
    p.add_argument("--sem-arquivo", action="store_true")
    args = p.parse_args()

    faltando = [a for a in args.audios if not Path(a).is_file()]
    if faltando:
        print("Nao achei: " + ", ".join(faltando), file=sys.stderr)
        raise SystemExit(1)

    modelo = carregar_modelo(args.modelo)

    for caminho in args.audios:
        audio = Path(caminho)
        segmentos, _ = modelo.transcribe(str(audio), language=args.idioma, beam_size=5)
        texto = " ".join(s.text.strip() for s in segmentos).strip()

        print(f"\n=== {audio.name}")
        sys.stdout.flush()  # senao o texto abaixo (escrito em bytes) sai antes do titulo
        # errors="replace": terminal do Windows nem sempre aguenta acento.
        sys.stdout.buffer.write(texto.encode(sys.stdout.encoding or "utf-8", errors="replace"))
        sys.stdout.buffer.flush()
        print()

        if not args.sem_arquivo:
            saida = audio.with_suffix(".txt")
            saida.write_text(texto, encoding="utf-8")
            print(f"[salvo em {saida}]")


if __name__ == "__main__":
    main()
