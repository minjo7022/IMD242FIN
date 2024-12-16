// 종횡비를 고정하고 싶을 경우: 아래 두 변수를 0이 아닌 원하는 종, 횡 비율값으로 설정.
// 종횡비를 고정하고 싶지 않을 경우: 아래 두 변수 중 어느 하나라도 0으로 설정.
const aspectW = 4;
const aspectH = 3;

// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');

// 필요에 따라 이하에 변수 생성.
const { Body, Bodies, Engine, Composite, Mouse, MouseConstraint, Vector } =
  Matter;
let engine, world;
let boxes = [];
let walls = [];
let mouse, mouseConstraint;
let selectedObject = null;
let isDragging = false;

function setup() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  if (aspectW === 0 || aspectH === 0) {
    canvas = createCanvas(containerW, containerH);
    canvas.parent(container);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else if (containerW / containerH > aspectW / aspectH) {
    canvas = createCanvas((containerH * aspectW) / aspectH, containerH);
    canvas.parent(container);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else {
    canvas = createCanvas(containerW, (containerW * aspectH) / aspectW);
    canvas.parent(container);
  }
  init();
  // createCanvas를 제외한 나머지 구문을 여기 혹은 init()에 작성.
  engine = Engine.create();
  world = engine.world;

  boxes.push(Bodies.rectangle(width / 2, height * 0.2, 60, 60));
  Composite.add(world, boxes);
  console.log(boxes);

  walls.push(Bodies.rectangle(width * 0.5, 0, width, 100, { isStatic: true }));
  walls.push(
    Bodies.rectangle(width, height * 0.5, 100, height, { isStatic: true })
  );
  walls.push(
    Bodies.rectangle(width * 0.5, height, width, 100, { isStatic: true })
  );
  walls.push(
    Bodies.rectangle(0, height * 0.5, 100, height, { isStatic: true })
  );
  Composite.add(world, walls);

  mouse = Mouse.create(canvas.elt);
  mouse.pixelRatio = pixelDensity();
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constrain: {
      stiffness: 0.2,
      render: { visible: false },
    },
  });
  Composite.add(world, mouseConstraint);

  Engine.run(engine);
}

// windowResized()에서 setup()에 준하는 구문을 실행해야할 경우를 대비해 init이라는 명칭의 함수를 만들어 둠.
function init() {}

function Gravity() {
  const gravityWidth = width / 3;
  const gravityLeft = (width - gravityWidth) / 2;
  const gravityRight = gravityLeft + gravityWidth; //
  if (engine.world.gravity.y !== 1) {
    engine.world.gravity.y = 1;
  }
  boxes.forEach((box) => {
    if (
      box.position.y < 300 &&
      box.position.x > gravityLeft &&
      box.position.x < gravityRight
    ) {
      Body.setVelocity(box, Vector.create(box.velocity.x, 0));
    }
  });
}

function draw() {
  const red = map(mouseX, 0, width, 0, 255);
  const blue = map(mouseY, 0, height, 0, 255);
  background(red, 0, blue);

  Engine.update(engine);

  Gravity();
  fill(255, 255, 255, 100);
  noStroke();
  const gravityWidth = width / 3;
  rect((width - gravityWidth) / 2, 0, gravityWidth, 300);

  boxes.forEach((aBox) => {
    beginShape();
    aBox.vertices.forEach((aVertex) => {
      vertex(aVertex.x, aVertex.y);
    });
    endShape(CLOSE);
  });
}

function mousePressed() {
  isDragging = false;
  selectedObject = null;

  boxes.forEach((obj) => {
    const d = dist(mouseX, mouseY, obj.position.x, obj.position.y);
    if (d < 30 && !isDragging) {
      selectedObject = obj;
      isDragging = true;
    }
  });

  if (!isDragging) {
    const numShapes = int(random(1, 10));

    for (let i = 0; i < numShapes; i++) {
      const shapeType = random(['rectangle', 'circle', 'triangle']);
      let newShape;
      const xOffset = random(-50, 50);
      const yOffset = random(-50, 50);

      if (shapeType === 'rectangle') {
        newShape = Bodies.rectangle(
          mouseX + xOffset,
          mouseY + yOffset,
          50,
          50,
          {
            restitution: 0.6,
            friction: 0.05,
            frictionAir: 0.01,
          }
        );
      } else if (shapeType === 'circle') {
        newShape = Bodies.circle(mouseX + xOffset, mouseY + yOffset, 30, {
          restitution: 0.7,
          friction: 0.05,
          frictionAir: 0.01,
        });
      } else if (shapeType === 'triangle') {
        newShape = Bodies.polygon(mouseX + xOffset, mouseY + yOffset, 3, 40, {
          restitution: 0.7,
          friction: 0.05,
          frictionAir: 0.01,
        });
      }

      boxes.push(newShape);
      Composite.add(world, newShape);
    }
  }
}

function mouseReleased() {
  if (isDragging) {
    isDragging = false;
    selectedObject = null;
  }
}

function doubleClicked() {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const obj = boxes[i];
    const d = dist(mouseX, mouseY, obj.position.x, obj.position.y);
    if (d < 30) {
      Composite.remove(world, obj);
      boxes.splice(i, 1);

      const numFragments = 5;
      for (let j = 0; j < numFragments; j++) {
        let fragment;
        const xOffset = random(-50, 50);
        const yOffset = random(-50, 50);

        fragment = Bodies.circle(
          obj.position.x + xOffset,
          obj.position.y + yOffset,
          10,
          {
            restitution: 0.5,
            friction: 0.05,
            frictionAir: 0.01,
          }
        );
        boxes.push(fragment);
        Composite.add(world, fragment);
      }
      break;
    }
  }
}

function windowResized() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스 크기를 조정.
  if (aspectW === 0 || aspectH === 0) {
    resizeCanvas(containerW, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else if (containerW / containerH > aspectW / aspectH) {
    resizeCanvas((containerH * aspectW) / aspectH, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else {
    resizeCanvas(containerW, (containerW * aspectH) / aspectW);
  }
  // 위 과정을 통해 캔버스 크기가 조정된 경우, 다시 처음부터 그려야할 수도 있다.
  // 이런 경우 setup()의 일부 구문을 init()에 작성해서 여기서 실행하는게 편리하다.
  // init();
  Body.setPosition(walls[1], Vector.create(width, height * 0.5));
  Body.setPosition(walls[2], Vector.create(width * 0.5, height));
}
