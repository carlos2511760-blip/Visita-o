# 🌍 Wanderer 3D — Lugares Famosos do Mundo

Um site web 3D interativo, relaxante e acolhedor (estilo *chill / lo-fi / cozy*), totalmente jogável no navegador sem instalação, inspirado no design visual e componentes do **Messenger Design System**.

---

## 🎮 Como Jogar / Explorar

### Link Direto no Navegador
* [http://127.0.0.1:3344/index.html](http://127.0.0.1:3344/index.html)

### Inicialização Rápida no Windows
Dê um duplo clique no arquivo [`abrir.bat`](abrir.bat) ou execute no terminal:
```bash
python serve.py
```

---

## 🕹️ Controles

### Desktop (Teclado + Mouse)
* **WASD** ou **Setas**: Mover o personagem livremente
* **Shift**: Correr
* **Espaço**: Pular
* **Mouse (Arrastar com clique esquerdo/direito)**: Girar a câmera orbital em 360°
* **Scroll do Mouse**: Zoom da câmera (aproximar / afastar)
* **E**: Interagir (conversar com NPCs e descobrir Pontos de Interesse)
* **Barra de Reações**: Clique nos emojis (`👋`, `✨`, `❤️`, `👀`, `☕`, `📸`, `🌸`, `🎵`) para soltar balões animados de reação

### Mobile (Touch)
* **Joystick Virtual (Lado esquerdo da tela)**: Movimentação analógica 360°
* **Deslizar no lado direito da tela**: Girar a câmera
* **Botões de Toque**: Pular, Correr e Interagir (`E`)

---

## 🗺️ Destinos Disponíveis na Demonstração

### 1. 🗼 Paris — Torre Eiffel & Champ de Mars
* **Torre Eiffel 3D Estilizada**: 4 pilares monumentais com arcos, plataformas de observação, pináculo e farol noturno giratório.
* **Champ de Mars**: Jardins simétricos, alamedas de cascalho, postes de ferro fundido iluminados e árvores de outono balançando com o vento.
* **Café des Rêves**: Bistrô parisiense com mesas de mármore ao ar livre, croissants e toldo listrado.
* **NPCs**: *Pierre (O Pintor)* em seu cavalete e *Camille (A Confeiteira)* no café.
* **Pontos de Interesse (POIs)**: A Grande Dama de Ferro, Arte da Flânerie e Alamedas Históricas.

### 2. ⛰️ Rio de Janeiro — Cristo Redentor & Corcovado
* **Morro do Corcovado**: Cume imponente acima da Floresta da Tijuca com terraços panorâmicos em múltiplos níveis.
* **Monumento ao Cristo Redentor**: Escultura de 38 metros em pedra-sabão com os icônicos braços abertos em acolhimento eterno.
* **Panorama da Baía de Guanabara & Pão de Açúcar**: Vista do Pão de Açúcar emergindo da água azul cintilante com veleiros.
* **Vegetação Tropical**: Palmeiras reais balançando na brisa marinha e pássaros planando sobre o vale.
* **NPCs**: *Zé do Mirante (Guia Turístico)* e *Dona Cida (Carrinho de Água de Coco)*.
* **Pontos de Interesse (POIs)**: Santuário do Cristo, Mirante do Pão de Açúcar e Parque Nacional da Tijuca.

---

## ✨ Recursos & Funcionalidades

1. **Visual Cel-Shaded & Toon Shading**: Shaders com rampas de tons cartunescos, luz suave, contornos limpos e céu gradiente atmosférico.
2. **Avatar Personalizável**:
   * Escolha de paleta de cores para jaqueta, mochila e calças.
   * Acessórios de cabeça: Boina Francesa, Viseira Tropical, Gorro Cozy ou sem chapéu.
3. **Multiplayer Simulado Vivo**:
   * Viajantes autônomos (*Milo*, *Sophie*, *Lucas*, *Aoi*) passeiam pelos cenários, admiram mirantes e reagem em tempo real aos seus emotes com acenos e balões de reação.
4. **Modo Cartão-Postal (Fotografia)**:
   * Enquadramento com grade de proporção áurea, carimbo oficial do destino com data e botão de disparo que gera e baixa uma foto PNG instantânea do jogo.
5. **Caderno de Viagem (Descobertas)**:
   * Checklist que registra cada marco histórico e diálogo descoberto durante sua exploração.
6. **Trilha Sonora Procedural Lo-Fi (Web Audio API)**:
   * Acordes quentes de teclado elétrico, chiado suave de vinil e ambiência relaxante específica para cada destino (Paris com progressão nostálgica e Rio com harmonia de bossa-nova).
