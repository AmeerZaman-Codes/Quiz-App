const questions = [
  {
    question: "Which language is primarily used for styling web pages?",
    options: ["Javascript", "HTML", "CSS", "Python"],
    answer: "CSS",
  },
  {
    question: "What does “HTTP” stand for?",
    options: [
      "HyperText Transfer Protocol",
      "High Transfer Text Program",
      "Home Tool Transfer Page",
      "Hyper Transfer Technology Program",
    ],
    answer: "HyperText Transfer Protocol",
  },
  {
    question: "Which company developed JavaScript?",
    options: ["Google", "Microsoft", "Netscape", "Meta"],
    answer: "Netscape",
  },
  {
    question: "What symbol is used for single-line comments in JavaScript?",
    options: ["<!-- -->", "#", "/* */", "//"],
    answer: "//",
  },
  {
    question: "Which of the following is a database?",
    options: ["React", "MongoDB", "Tailwind CSS", "Express.js"],
    answer: "MongoDB",
  },
];

const questionContainer = document.getElementById("questionContainer");
const optionsButton = document.querySelectorAll(".option");
let currentIndex = 0;
const numberOfQuestons = questions.length;
let totalQuestions = (document.getElementById("totalQuestion").textContent =
  numberOfQuestons);
const nextButton = document.getElementById("next-button");
let questionNumber = document.getElementById("currenQuestion");
const scoreBoard = document.querySelector(".score-board");
const quizContainer = document.querySelector(".container");
let score = 0;
const scoreContainer = document.getElementById("score");
let answered = false;

function displayQuestion() {
  
  let currentQuestion = questions[currentIndex];
   questionContainer.classList.remove("fade-in");
  void questionContainer.offsetWidth; // force reflow
  questionContainer.classList.add("fade-in");
  questionNumber.innerText = currentIndex + 1;
  questionContainer.innerText = currentQuestion.question;
  displayOptions(currentQuestion.options);

  optionsButton.forEach(btn => {
    btn.classList.remove("fade-in");
    void btn.offsetWidth;
    btn.classList.add("fade-in");
  });
  
}

function displayOptions(options) {
  optionsButton.forEach((element, index) => {
    element.innerText = options[index];
  });
}

optionsButton.forEach((element) => {
  element.addEventListener("click", () => {
    const innerText = element.innerText;
    answered = true;
    optionsButton.forEach((otherButton) => {
      otherButton.disabled = true;
    });

    if (innerText === questions[currentIndex].answer) {
      element.style.backgroundColor = "Green";
      score++;
    } else {
      element.style.backgroundColor = "Red";
    }
  });
});

nextButton.addEventListener("click", () => {
  if (answered != true) {
    alert("Select Your Answer!");
    return;
  }

  currentIndex++;

  optionsButton.forEach((otherButton) => {
    otherButton.disabled = false;
    if (otherButton.style.backgroundColor === "green") {
      otherButton.style.backgroundColor = "";
    } else if (otherButton.style.backgroundColor === "red") {
      otherButton.style.backgroundColor = "";
    }
  });
  answered = false;

  if (currentIndex >= questions.length) {
    scoreBoard.classList.remove("unactive");
    quizContainer.classList.add("unactive");
    scoreContainer.innerText = score;
  }
  displayQuestion();
});

const resetBtn = document.getElementById("reset");
resetBtn.addEventListener("click", () => {
  scoreBoard.classList.add("unactive");
  quizContainer.classList.remove("unactive");
  currentIndex = 0;
  score = 0;
  displayQuestion();
});

displayQuestion();
