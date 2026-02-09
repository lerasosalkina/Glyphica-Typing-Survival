// ========== RUSSIAN WORDS ==========
const WORDS_RU_EASY = [
    "код", "мир", "лук", "лес", "дом", "кот", "сон", "мышь", "гром", "звук",
    "факт", "соль", "ночь", "день", "путь", "шаг", "бег", "бой", "ход", "вид",
    "глаз", "нос", "рот", "зал", "том", "яд", "пар", "лед", "газ", "ток",
    "век", "миг", "дар", "жар", "сад", "дед", "сын", "дочь", "мать", "отец"
];

const WORDS_RU_MEDIUM = [
    "лампа", "экран", "пожар", "земля", "ветер", "огонь", "вода", "песок", "камень", "скала",
    "трава", "цветы", "дерево", "кусты", "птица", "рыба", "зверь", "человек", "робот", "машина",
    "поезд", "метро", "такси", "город", "рынок", "магазин", "школа", "парк", "улица", "район",
    "книга", "ручка", "стол", "стул", "шкаф", "дверь", "окно", "стена", "крыша", "подвал"
];

const WORDS_RU_HARD = [
    "программист", "компьютер", "клавиатура", "монитор", "интернет", "технология", "разработка", "алгоритм", "структура", "переменная",
    "функция", "объект", "массив", "строка", "цикл", "условие", "оператор", "значение", "результат", "ошибка",
    "исключение", "отладка", "компиляция", "интерфейс", "наследование", "полиморфизм", "инкапсуляция", "абстракция", "рекурсия", "итерация",
    "оптимизация", "производительность", "безопасность", "шифрование", "авторизация", "аутентификация", "базаданных", "сервер", "клиент", "браузер"
];

// ========== ENGLISH WORDS ==========
const WORDS_EN_EASY = [
    "code", "fire", "tree", "cat", "dog", "run", "sun", "moon", "star", "game",
    "play", "jump", "fast", "slow", "word", "type", "key", "win", "box", "cup",
    "map", "sky", "red", "blue", "door", "floor", "light", "dark", "cold", "warm",
    "hand", "foot", "head", "eye", "ear", "nose", "book", "pen", "desk", "chair"
];

const WORDS_EN_MEDIUM = [
    "player", "screen", "input", "output", "system", "memory", "storage", "button", "window", "folder",
    "coding", "typing", "gaming", "battle", "attack", "defend", "shield", "weapon", "energy", "health",
    "forest", "mountain", "river", "ocean", "island", "desert", "jungle", "village", "castle", "bridge",
    "rocket", "planet", "galaxy", "robot", "engine", "machine", "circuit", "network", "signal", "power"
];

const WORDS_EN_HARD = [
    "keyboard", "survival", "explosion", "lightning", "developer", "algorithm", "interface", "animation",
    "processing", "generator", "framework", "component", "typescript", "javascript", "programming",
    "application", "architecture", "performance", "optimization", "encryption", "cybersecurity",
    "vulnerability", "authentication", "authorization", "serialization", "configuration", "implementation",
    "documentation", "specification", "functionality", "accessibility", "compatibility", "maintainability",
    "extensibility", "scalability", "reliability", "availability", "transparency", "visualization"
];

// Attach to window object to be accessible globally
window.ALL_WORDS = {
    ru: {
        easy: WORDS_RU_EASY,
        medium: WORDS_RU_MEDIUM,
        hard: WORDS_RU_HARD
    },
    en: {
        easy: WORDS_EN_EASY,
        medium: WORDS_EN_MEDIUM,
        hard: WORDS_EN_HARD
    }
};
