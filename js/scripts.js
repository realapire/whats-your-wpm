const txtInput = document.querySelector('#txtInput');
const btnStart = document.querySelector('#btnStart');
const btnRestart = document.querySelector('#btnRestart');

const introPanel = document.querySelector('.intro');
const gamePanel = document.querySelector('.game');
const statsPanel = document.querySelector('.stats');

const gameTitle = document.querySelector('#gameTitle');

const wordsContainer = document.querySelector('.words-container');

const txtTimer = document.querySelector('#txtTimer');

const txtWpm = document.querySelector('#txtWpm');
const txtAcc = document.querySelector('#txtAcc');
const txtErr = document.querySelector('#txtErr');

let startCount = 3;
let totalTime = 30;

let currentIndex = 0;
let words = [];


const MAX_LETTER_OVERSIZE = 1.5;

let focusInput, gameCountDown;

btnStart.addEventListener('click', function(e) {
    e.preventDefault();
    startCount = 3;
    btnStart.remove();  
    gameTitle.innerText = `Game will start in ${startCount} seconds`;

    let startCountdown = setInterval(() => {
        startCount--;
        if (startCount === 0) {
            clearInterval(startCountdown);
            gameTitle.innerText = 'Game has started!';
            gamePanel.classList.remove('hidden');
            introPanel.classList.add('hidden');
        } else {
            gameTitle.innerText = `Game will start in ${startCount} seconds`;
        }
    }, 1000);

    startGame();
});

async function startGame() {
    words = await getRandomWords();
    
    for (let i = 0; i < words.length; i++) {
        wordsContainer.innerHTML += `<div class='word'>${words[i]}</div>`;
    }

    currentIndex = 0;
    totalTime = 30;
    txtInput.removeAttribute('disabled');

    wordsContainer.querySelectorAll('.word')[currentIndex].classList.add('current');
    renderSyntax();

    focusInput = setInterval(() => {
        txtInput.focus();
    }, 10);

    gameCountDown = setInterval(() => {
        totalTime--;
        if (totalTime === 0) {
            endGame();
        } else {
            txtTimer.innerText = totalTime + 's';
        }
    }, 1000);
}

async function getRandomWords(amount = 20) {
    const resp = await fetch(`https://random-word.ryanrk.com/api/en/word/random/${amount}`);
    return await resp.json();
}

txtInput.addEventListener('keydown', function(e) {
    if (!txtInput.value.trim()) {
        return;
    }

    if (e.key === ' ' || e.keyCode === 32) {
        nextWord();
    }
})

txtInput.addEventListener('input', function() {
    const strInput = txtInput.value.trim();
    
    if (!wordsContainer.querySelectorAll('.word')[currentIndex]) return;

    const currentLetters = Array.from(wordsContainer.querySelectorAll('.word')[currentIndex].querySelectorAll('.letter'));

    if (strInput === '') {
        const remainingLetters = currentLetters.slice(strInput.length);
        remainingLetters.forEach(letter => {
            if (letter.classList.contains('correct') || letter.classList.contains('wrong')) {
                letter.classList.remove('correct');
                letter.classList.remove('wrong');
            }
        });

        return;
    }

    if (words != null) {
        if (currentLetters) {
            if (currentLetters.length >= words[currentIndex].length * MAX_LETTER_OVERSIZE) {
                const maxLength = words[currentIndex].length * MAX_LETTER_OVERSIZE;
                txtInput.value = strInput.slice(0, maxLength);
            }
    
            if (strInput.length > currentLetters.length) {
                // Append the new elements in the array
                const newLetters = Array.from(strInput.slice(currentLetters.length)).map(letter => {
                    const newLetter = document.createElement('span');
                    newLetter.classList.add('letter');
                    newLetter.classList.add('oversize');
                    newLetter.innerText = letter;
                    return newLetter;
                });
                wordsContainer.querySelectorAll('.word')[currentIndex].append(...newLetters);
            } else {
                const lastInputLetter = currentLetters[strInput.length - 1];
                const lastInputLetterText = lastInputLetter.innerText;

                // Exclude 'oversize' characters from being checked
                if (!lastInputLetter.classList.contains('oversize')) {
                    if (strInput.endsWith(lastInputLetterText)) {
                        lastInputLetter.classList.remove('wrong');
                        lastInputLetter.classList.add('correct');
                    } else {
                        lastInputLetter.classList.remove('correct');
                        lastInputLetter.classList.add('wrong');
                    }
                }
    
                const remainingLetters = currentLetters.slice(strInput.length);
                remainingLetters.forEach(letter => {
                    if (letter.classList.contains('correct') || letter.classList.contains('wrong')) {
                        letter.classList.remove('correct');
                        letter.classList.remove('wrong');
                    }
                });
            }
        }
    }

    const removedLetters = currentLetters.slice(strInput.length);
    removedLetters.forEach(letter => {
        if (letter.classList.contains('oversize')) {
            letter.remove();
        }
    });
});


function renderSyntax() {
    const currentWordNode = wordsContainer.querySelectorAll('.word')[currentIndex];
    const currentWord = currentWordNode.innerText;
    txtInput.setAttribute('max', words[currentIndex].length * 2)
    currentWordNode.innerHTML = wordToCharStr(currentWord);
}

function wordToCharStr(x) {
    let strLetter = '';
    for (let i = 0; i < x.length; i++) {
        strLetter += `<span class='letter'>${x[i]}</span>`; 
    }

    return strLetter;
}

function nextWord() {
    if (wordsContainer.querySelectorAll('.word')[currentIndex]) {
        wordsContainer.querySelectorAll('.word')[currentIndex].classList.remove('current');
    }
    currentIndex++;
    if (!wordsContainer.querySelectorAll('.word')[currentIndex]) {
        endGame();
        return;
    }
    wordsContainer.querySelectorAll('.word')[currentIndex].classList.add('current');
    txtInput.value = '';
    txtInput.focus();
    renderSyntax(); 
}

function endGame() {
    console.log('Finished');
    clearInterval(gameCountDown);
    clearInterval(focusInput);

    txtInput.setAttribute('disabled', 'true')

    const words = wordsContainer.querySelectorAll('.word');
    let correctWordCount = 0;
    let totalTypedCharacters = 0;
    let correctCharacters = 0;
    let incorrectCharacters = 0;
    let totalTypos = 0;

    words.forEach(word => {
        const letters = Array.from(word.querySelectorAll('.letter'));
        const allCorrect = letters.every(letter => letter.classList.contains('correct'));

        totalTypedCharacters += letters.length;
        correctCharacters += letters.filter(letter => letter.classList.contains('correct')).length;
        incorrectCharacters += letters.filter(letter => letter.classList.contains('wrong')).length;

        if (allCorrect) {
            correctWordCount++;
        }
    });

    totalTypos = incorrectCharacters;

    const accuracy = (correctCharacters / totalTypedCharacters) * 100;
    const errorRate = (incorrectCharacters / totalTypedCharacters) * 100;
    const averageWordLength = totalTypedCharacters / words.length;
    const timePerWord = totalTime / correctWordCount;
    const errorRatePerWord = (totalTypos / correctWordCount) * 100;
    const timePerCharacter = totalTime / totalTypedCharacters;
    let wpm = correctWordCount / (totalTime / 60);

    const statistics = {
        'Number of words with all letters correct': correctWordCount,
        'Accuracy (%)': accuracy.toFixed(2),
        'Error Rate (%)': errorRate.toFixed(2),
        'Total Typos': totalTypos,
        'Error Rate per Word (%)': errorRatePerWord.toFixed(2),
        'Average Word Length': averageWordLength.toFixed(2),
        'Time per Word (seconds)': timePerWord.toFixed(2),
        'Time per Character (seconds)': timePerCharacter.toFixed(2),
        'Words Per Minute (WPM)': wpm.toFixed(2)
    };

    console.table(statistics);

    if (wpm == Infinity) {
        wpm = 0;
    }

    txtWpm.innerText = wpm.toFixed(0);
    txtAcc.innerText = accuracy.toFixed(0) + '%';
    txtErr.innerText = errorRate.toFixed(0) + '%';

    gamePanel.classList.add('hidden');
    statsPanel.classList.remove('hidden');

    wordsContainer.innerHTML = '';
}


btnRestart.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('restart');
    statsPanel.classList.add('hidden');
    introPanel.classList.remove('hidden');
    btnStart.click();
});