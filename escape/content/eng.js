// 🔤 ABC 놀이터 (영어)
// WORDS: [영어, 그림, 우리말] — 듣고 고르기·철자 맞추기·짝 맞추기에 쓴다
// SENT: 표현·문장 문제
import { C, X, O, M } from './h.js';

export const WORDS = {
  1: [['cat', '🐱', '고양이'], ['dog', '🐶', '개'], ['pig', '🐷', '돼지'], ['cow', '🐮', '소'], ['bee', '🐝', '벌'], ['sun', '☀️', '해'], ['bus', '🚌', '버스'], ['egg', '🥚', '달걀'], ['hat', '👒', '모자'], ['cup', '🥤', '컵'], ['bed', '🛏️', '침대'], ['ant', '🐜', '개미']],
  2: [['fish', '🐟', '물고기'], ['bird', '🐦', '새'], ['duck', '🦆', '오리'], ['milk', '🥛', '우유'], ['cake', '🍰', '케이크'], ['book', '📖', '책'], ['ball', '⚽', '공'], ['frog', '🐸', '개구리'], ['lion', '🦁', '사자'], ['bear', '🐻', '곰'], ['tree', '🌳', '나무'], ['star', '⭐', '별']],
  3: [['apple', '🍎', '사과'], ['tiger', '🐯', '호랑이'], ['pizza', '🍕', '피자'], ['water', '💧', '물'], ['piano', '🎹', '피아노'], ['house', '🏠', '집'], ['robot', '🤖', '로봇'], ['horse', '🐴', '말'], ['bread', '🍞', '빵'], ['chair', '🪑', '의자'], ['grape', '🍇', '포도'], ['snake', '🐍', '뱀']],
  4: [['rabbit', '🐰', '토끼'], ['banana', '🍌', '바나나'], ['monkey', '🐒', '원숭이'], ['orange', '🍊', '오렌지'], ['school', '🏫', '학교'], ['rainy', '🌧️', '비가 오는'], ['sunny', '☀️', '맑은'], ['happy', '😀', '행복한'], ['flower', '🌸', '꽃'], ['pencil', '✏️', '연필'], ['carrot', '🥕', '당근'], ['window', '🪟', '창문']],
  5: [['elephant', '🐘', '코끼리'], ['dolphin', '🐬', '돌고래'], ['library', '📚', '도서관'], ['hospital', '🏥', '병원'], ['umbrella', '☂️', '우산'], ['birthday', '🎂', '생일'], ['computer', '💻', '컴퓨터'], ['bicycle', '🚲', '자전거'], ['teacher', '🧑‍🏫', '선생님'], ['giraffe', '🦒', '기린'], ['sandwich', '🥪', '샌드위치'], ['kitchen', '🍳', '부엌']],
  6: [['museum', '🏛️', '박물관'], ['airplane', '✈️', '비행기'], ['mountain', '⛰️', '산'], ['breakfast', '🥞', '아침밥'], ['scientist', '🧑‍🔬', '과학자'], ['festival', '🎉', '축제'], ['vegetable', '🥦', '채소'], ['chocolate', '🍫', '초콜릿'], ['basketball', '🏀', '농구'], ['restaurant', '🍽️', '식당'], ['strawberry', '🍓', '딸기'], ['dinosaur', '🦖', '공룡']],
};

export const SENT = {
  1: [
    C('"Hello!"는 무슨 뜻일까요?', ['안녕!', '잘 자!', '고마워!', '미안해!']),
    C('숫자 "three"는?', ['3', '1', '5', '10']),
    M('색깔 영어와 색을 이어요.', [['red', '🔴'], ['blue', '🔵'], ['yellow', '🟡'], ['green', '🟢']]),
    M('숫자 영어와 숫자를 이어요.', [['one', '1'], ['two', '2'], ['three', '3'], ['four', '4']]),
    C('"Bye!"는 무슨 뜻일까요?', ['잘 가!', '반가워!', '고마워!', '미안해!']),
    X('"cat"은 고양이라는 뜻이에요.', true),
  ],
  2: [
    C('"Thank you."는 무슨 뜻일까요?', ['고마워요.', '미안해요.', '안녕히 가세요.', '반가워요.']),
    M('숫자 영어와 숫자를 이어요.', [['five', '5'], ['six', '6'], ['seven', '7'], ['eight', '8']]),
    C('"Sit down."은 무슨 뜻일까요?', ['앉아요.', '일어나요.', '뛰어요.', '자요.']),
    C('"I\'m sorry."는 무슨 뜻일까요?', ['미안해요.', '고마워요.', '배고파요.', '반가워요.']),
    M('몸을 나타내는 영어를 이어요.', [['head', '머리'], ['hand', '손'], ['eye', '눈'], ['nose', '코']]),
    O('영어 문장이 되게 차례대로 놓아요.', ['I', 'am', 'happy.'], '"I am happy." = 나는 행복해요.'),
  ],
  3: [
    C('"What\'s your name?"에 알맞은 대답은?', ['I\'m Mina.', 'I\'m fine.', 'It\'s a cat.', 'Yes, I can.']),
    C('"How are you?"에 알맞은 대답은?', ['I\'m fine, thank you.', 'I\'m ten.', 'It\'s red.', 'Goodbye.']),
    O('영어 문장이 되게 차례대로 놓아요.', ['I', 'like', 'pizza.'], '"I like pizza." = 나는 피자를 좋아해요.'),
    C('"Can you swim?" — 수영할 수 있을 때 대답은?', ['Yes, I can.', 'No, I can\'t.', 'I\'m fine.', 'It\'s a fish.']),
    M('동물 영어와 뜻을 이어요.', [['tiger', '호랑이'], ['horse', '말'], ['snake', '뱀'], ['lion', '사자']]),
    C('"Don\'t run!"은 무슨 뜻일까요?', ['뛰지 마!', '뛰어!', '앉아!', '먹지 마!']),
  ],
  4: [
    C('"What day is it today?"는 무엇을 묻는 말일까요?', ['오늘 무슨 요일인지', '오늘 날씨', '지금 몇 시인지', '내 나이']),
    C('"How\'s the weather?" — 비가 올 때 알맞은 대답은?', ['It\'s rainy.', 'It\'s sunny.', 'It\'s Monday.', 'I\'m happy.']),
    M('요일 영어와 뜻을 이어요.', [['Monday', '월요일'], ['Wednesday', '수요일'], ['Friday', '금요일'], ['Sunday', '일요일']]),
    O('영어 문장이 되게 차례대로 놓아요.', ['What', 'time', 'is', 'it?'], '"What time is it?" = 몇 시예요?'),
    C('"It\'s 3 o\'clock."은 무슨 뜻일까요?', ['3시예요.', '3살이에요.', '3개예요.', '3월이에요.']),
    C('"Whose bag is this?"는 무엇을 묻는 말일까요?', ['누구의 가방인지', '가방 값', '가방 색', '가방 개수']),
  ],
  5: [
    C('"Where is the library?"는 무엇을 묻는 말일까요?', ['도서관이 어디 있는지', '책이 몇 권인지', '도서관이 언제 여는지', '누가 사서인지']),
    C('"How much is it?"은 무엇을 묻는 말일까요?', ['값이 얼마인지', '몇 개인지', '몇 살인지', '얼마나 먼지']),
    M('달(월) 영어와 뜻을 이어요.', [['March', '3월'], ['May', '5월'], ['August', '8월'], ['December', '12월']]),
    O('영어 문장이 되게 차례대로 놓아요.', ['I', 'want', 'to', 'be', 'a', 'teacher.'], '"I want to be a teacher." = 나는 선생님이 되고 싶어요.'),
    C('"Go straight and turn right."는?', ['쭉 가서 오른쪽으로 도세요.', '쭉 가서 왼쪽으로 도세요.', '뒤로 가세요.', '여기서 멈추세요.']),
    C('"What\'s wrong?"(어디 아프니?)에 알맞은 대답은?', ['I have a headache.', 'I\'m twelve.', 'It\'s sunny.', 'Nice to meet you.']),
  ],
  6: [
    C('"I went to the museum yesterday."에서 "went"는 무엇의 과거형일까요?', ['go', 'want', 'win', 'walk']),
    C('"What do you want to be?"에 알맞은 대답은?', ['I want to be a scientist.', 'I want some water.', 'I\'m twelve.', 'It\'s sunny.']),
    O('영어 문장이 되게 차례대로 놓아요.', ['I', 'went', 'to', 'the', 'museum', 'yesterday.'], '"나는 어제 박물관에 갔어요."'),
    M('동사와 과거형을 이어요.', [['go', 'went'], ['eat', 'ate'], ['see', 'saw'], ['have', 'had']]),
    C('"Which is bigger, a dog or an elephant?"에 알맞은 대답은?', ['An elephant is bigger.', 'A dog is bigger.', 'Yes, it is.', 'I like dogs.']),
    C('"You should wear a helmet."은 무슨 뜻일까요?', ['헬멧을 써야 해요.', '헬멧을 사세요.', '헬멧이 없어요.', '헬멧이 커요.']),
  ],
};
