// Questions
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
  {
    question: "Which HTML tag is used to create a hyperlink?",
    options: ["div", "a", "link", "href"],
    answer: "a",
  },
  {
    question: "Which CSS property controls text size?",
    options: ["font-style", "text-size", "font-size", "text-font"],
    answer: "font-size",
  },
  {
    question: "Which JavaScript method is used to write data in the console?",
    options: ["console.log()", "print()", "log.console()", "write.console()"],
    answer: "console.log()",
  },
  {
    question: "What does CSS stand for?",
    options: [
      "Cascading Style Sheets",
      "Creative Style System",
      "Color Styling Sheet",
      "Code Style Syntax",
    ],
    answer: "Cascading Style Sheets",
  },
  {
    question: "Which HTML element contains all the visible content?",
    options: ["body", "header", "meta", "head"],
    answer: "body",
  },
  {
    question: "Who created Python?",
    options: ["Microsoft", "Google", "Guido van Rossum", "Netscape"],
    answer: "Guido van Rossum",
  },
  {
    question: "Which JavaScript keyword declares a variable?",
    options: ["var", "let", "const", "All of the above"],
    answer: "All of the above",
  },
  {
    question: "What does API stand for?",
    options: [
      "Application Programming Interface",
      "Applied Program Internet",
      "Advanced Protocol Interface",
      "Application Process Information",
    ],
    answer: "Application Programming Interface",
  },
  {
    question: "Which of the following is a frontend framework?",
    options: ["React", "Node.js", "Express", "MongoDB"],
    answer: "React",
  },
  {
    question: "Which symbol is used for ID selectors in CSS?",
    options: [".", "#", "*", ":"],
    answer: "#",
  },
  {
    question: "What does DOM stand for?",
    options: [
      "Document Object Model",
      "Data Object Management",
      "Digital Order Maker",
      "Document Output Module",
    ],
    answer: "Document Object Model",
  },
  {
    question: "Which HTML tag is used for an image?",
    options: ["image", "img", "pic", "src"],
    answer: "img",
  },
  {
    question: "Which of these is NOT a programming language?",
    options: ["Python", "Java", "HTML", "C++"],
    answer: "HTML",
  },
  {
    question: "Which operator checks strict equality in JavaScript?",
    options: ["==", "=", "===", "!="],
    answer: "===",
  },
  {
    question: "Which CSS property adds space inside an element?",
    options: ["margin", "padding", "spacing", "gap"],
    answer: "padding",
  },
  {
    question: "Which HTML element is used for the largest heading?",
    options: ["h6", "head", "h1", "title"],
    answer: "h1",
  },
  {
    question: "What does SQL stand for?",
    options: [
      "Structured Query Language",
      "Strong Query Logic",
      "Simple Query Line",
      "System Query Language",
    ],
    answer: "Structured Query Language",
  },
  {
    question: "Which of these is a backend technology?",
    options: ["Node.js", "CSS", "HTML", "Bootstrap"],
    answer: "Node.js",
  },
  {
    question: "Which symbol is used for multi-line comments in JavaScript?",
    options: ["//", "<!-- -->", "/* */", "##"],
    answer: "/* */",
  }
];

const questionContainer = document.getElementById("questionContainer");
const optionsButton = document.querySelectorAll(".option");
let currentIndex = 0;
const numberOfQuestons = questions.length;
let totalQuestions = document.getElementById("totalQuestion").innerText = numberOfQuestons;
const nextButton = document.getElementById("next-button");
let questionNumber = document.getElementById("currenQuestion");
const scoreBoard = document.querySelector(".score-board");
const quizContainer = document.querySelector(".container");
let score = 0;
const scoreContainer = document.getElementById("score");
let answered = false; 
let totalQuestions2 = document.getElementById("totalQuestion2").innerText = numberOfQuestons;
totalQuestion2.style.color = "black";
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
