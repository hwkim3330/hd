// 전역 변수
let editor;
let isDarkMode = false;

// 초기 마크다운 콘텐츠
const initialMarkdown = `# 한글다운 마크다운 에디터

> 한글 문서 작성을 위한 현대적인 마크다운 에디터

## 주요 특징

### 🚀 강력한 편집 기능
- **CodeMirror** 기반 - 강력한 편집 기능
- **실시간 미리보기** - 작성하면서 바로 확인
- **GitHub Flavored Markdown** 완벽 지원
- **로컬 스토리지 자동 저장** - 새로고침해도 문서 유지
- **파일 저장/불러오기** 지원

### 📝 텍스트 서식
**굵은 글씨**, *기울임*, ~~취소선~~, \`인라인 코드\`

### 📊 테이블 지원
| 기능 | 설명 | 단축키 |
|------|------|--------|
| 저장 | 마크다운 파일 저장 | Ctrl+S |
| 열기 | 파일 불러오기 | Ctrl+O |
| 내보내기 | HTML로 내보내기 | - |

### 💻 코드 하이라이팅
\`\`\`javascript
// 한글다운 초기화
const editor = new HangeulDown({
  theme: 'light',
  autoSave: true,
  realTimePreview: true
});

editor.on('change', (content) => {
  console.log('문서가 변경되었습니다');
});
\`\`\`

### ✅ 체크리스트
- [x] 마크다운 편집기 구현
- [x] 실시간 미리보기
- [x] 파일 저장/불러오기
- [ ] PDF 내보내기
- [ ] 클라우드 동기화

### 📐 수식 지원
인라인 수식: $E = mc^2$

블록 수식:
$$\\int_{a}^{b} f(x)dx = F(b) - F(a)$$

이차 방정식: $ax^2 + bx + c = 0$의 해는 $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$

### 🔗 유용한 링크
- [마크다운 가이드](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

---

> 💡 **팁**: 상단 툴바를 사용하여 빠르게 마크다운 요소를 삽입할 수 있습니다.

*한글다운으로 아름다운 문서를 작성하세요!* ✨`;

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    loadFromStorage();
    setupEventListeners();
});

// 에디터 초기화
function initializeEditor() {
    const textarea = document.getElementById('editor');

    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'markdown',
        theme: 'default',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        extraKeys: {
            'Ctrl-S': saveToFile,
            'Ctrl-O': loadFile,
            'Ctrl-B': () => formatText('**', '**'),
            'Ctrl-I': () => formatText('*', '*'),
            'Ctrl-U': () => formatText('~~', '~~'),
            'Ctrl-K': insertLink,
            'Ctrl-P': () => window.print(),
            'Ctrl-`': insertInlineCode,
            'Ctrl-Shift-K': insertCode,
            'Ctrl-Shift-F': insertFootnote,
            'Ctrl-Shift-D': insertDetails
        }
    });

    // 변경 이벤트 리스너
    editor.on('change', function() {
        updatePreview();
        saveToStorage();
    });

    // 초기 콘텐츠 설정
    const savedContent = localStorage.getItem('hangeuldown-content');
    editor.setValue(savedContent || initialMarkdown);
    updatePreview();
}

// 로컬 스토리지에서 불러오기
function loadFromStorage() {
    const savedTheme = localStorage.getItem('hangeuldown-theme');
    if (savedTheme === 'dark') {
        toggleTheme();
    }
}

// 로컬 스토리지에 저장
function saveToStorage() {
    localStorage.setItem('hangeuldown-content', editor.getValue());
}

// 이벤트 리스너 설정
function setupEventListeners() {
    document.getElementById('fileInput').addEventListener('change', handleFileLoad);

    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
        // ESC 키로 모달 닫기
        if (e.key === 'Escape') {
            const tableDialog = document.getElementById('tableDialog');
            if (tableDialog.style.display === 'flex') {
                closeTableDialog();
                return;
            }
        }

        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    saveToFile();
                    break;
                case 'o':
                    e.preventDefault();
                    loadFile();
                    break;
                case 'p':
                    e.preventDefault();
                    window.print();
                    break;
                case '1':
                    e.preventDefault();
                    insertText('# ');
                    break;
                case '2':
                    e.preventDefault();
                    insertText('## ');
                    break;
                case '3':
                    e.preventDefault();
                    insertText('### ');
                    break;
                case 'e':
                    e.preventDefault();
                    insertCode();
                    break;
                case 'q':
                    e.preventDefault();
                    insertQuote();
                    break;
                case 't':
                    e.preventDefault();
                    showTableDialog();
                    break;
            }
        }
    });

    // 모달 배경 클릭으로 닫기
    document.getElementById('tableDialog').addEventListener('click', function(e) {
        if (e.target === this) {
            closeTableDialog();
        }
    });
}

// 미리보기 업데이트
function updatePreview() {
    const content = editor.getValue();
    const html = marked.parse(content);
    const preview = document.getElementById('preview');
    preview.innerHTML = html;

    // KaTeX 수식 렌더링
    renderMathInElement(preview, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\[', right: '\\]', display: true},
            {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false
    });
}

// 텍스트 포맷팅
function formatText(before, after) {
    const selection = editor.getSelection();
    if (selection) {
        editor.replaceSelection(before + selection + after);
    } else {
        const cursor = editor.getCursor();
        editor.replaceRange(before + '텍스트' + after, cursor);
    }
    editor.focus();
}

// 인라인 코드 삽입
function insertInlineCode() {
    const selection = editor.getSelection();
    if (selection) {
        editor.replaceSelection('`' + selection + '`');
    } else {
        const cursor = editor.getCursor();
        editor.replaceRange('`코드`', cursor);
    }
    editor.focus();
}

// 체크박스 삽입
function insertCheckbox() {
    const cursor = editor.getCursor();
    editor.replaceRange('\n- [ ] 체크리스트 항목', cursor);
    editor.focus();
}

// 각주 삽입
function insertFootnote() {
    const cursor = editor.getCursor();
    const footnoteNum = Math.floor(Math.random() * 1000);
    const footnoteText = `각주 텍스트[^${footnoteNum}]\n\n[^${footnoteNum}]: 각주 내용을 여기에 입력하세요.`;
    editor.replaceRange(footnoteText, cursor);
    editor.focus();
}

// 접기/펼치기 섹션 삽입
function insertDetails() {
    const detailsText = `
<details>
<summary>클릭하여 펼치기/접기</summary>

숨겨진 내용을 여기에 입력하세요.

</details>
`;
    const cursor = editor.getCursor();
    editor.replaceRange(detailsText, cursor);
    editor.focus();
}

// 텍스트 삽입
function insertText(text) {
    const cursor = editor.getCursor();
    editor.replaceRange(text, cursor);
    editor.focus();
}

// 링크 삽입
function insertLink() {
    const selection = editor.getSelection();
    const text = selection || '링크 텍스트';
    const linkText = `[${text}](https://url.com)`;

    if (selection) {
        editor.replaceSelection(linkText);
    } else {
        const cursor = editor.getCursor();
        editor.replaceRange(linkText, cursor);
    }
    editor.focus();
}

// 이미지 삽입
function insertImage() {
    const selection = editor.getSelection();
    const text = selection || '이미지 설명';
    const imageText = `![${text}](이미지-URL)`;

    if (selection) {
        editor.replaceSelection(imageText);
    } else {
        const cursor = editor.getCursor();
        editor.replaceRange(imageText, cursor);
    }
    editor.focus();
}

// 인용 삽입
function insertQuote() {
    const quoteText = '\n> 인용문을 입력하세요\n';
    const cursor = editor.getCursor();
    editor.replaceRange(quoteText, cursor);
    editor.focus();
}

// 구분선 삽입
function insertHorizontalRule() {
    const ruleText = '\n---\n';
    const cursor = editor.getCursor();
    editor.replaceRange(ruleText, cursor);
    editor.focus();
}

// 표 다이얼로그 표시
function showTableDialog() {
    document.getElementById('tableDialog').style.display = 'flex';
    updateTablePreview();

    // 이벤트 리스너 추가
    document.getElementById('tableRows').addEventListener('input', updateTablePreview);
    document.getElementById('tableCols').addEventListener('input', updateTablePreview);
}

// 표 다이얼로그 닫기
function closeTableDialog() {
    document.getElementById('tableDialog').style.display = 'none';
}

// 표 미리보기 업데이트
function updateTablePreview() {
    const rows = parseInt(document.getElementById('tableRows').value) || 3;
    const cols = parseInt(document.getElementById('tableCols').value) || 3;
    const hasHeader = document.getElementById('tableHeader').checked;
    const grid = document.getElementById('tablePreviewGrid');

    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.innerHTML = '';

    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'preview-cell';
        const row = Math.floor(i / cols);
        const col = i % cols;

        // 헤더 행 스타일링
        if (hasHeader && row === 0) {
            cell.style.background = 'var(--accent)';
            cell.style.opacity = '0.6';
            cell.style.fontWeight = 'bold';
            cell.textContent = `제목${col + 1}`;
        } else {
            cell.style.background = 'var(--bg-secondary)';
            cell.textContent = `${row}행${col + 1}열`;
        }

        grid.appendChild(cell);
    }
}

// 다이얼로그에서 표 삽입
function insertTableFromDialog() {
    const rows = parseInt(document.getElementById('tableRows').value) || 3;
    const cols = parseInt(document.getElementById('tableCols').value) || 3;
    const align = document.getElementById('tableAlign').value;
    const hasHeader = document.getElementById('tableHeader').checked;

    // 정렬 문자 생성
    let alignChar = '---';
    if (align === 'center') {
        alignChar = ':---:';
    } else if (align === 'right') {
        alignChar = '---:';
    }

    // 헤더 행
    const headerCells = Array(cols).fill(0).map((_, i) => `제목${i + 1}`);
    const headerRow = `| ${headerCells.join(' | ')} |`;

    // 구분 행
    const separatorRow = `|${Array(cols).fill(alignChar).join('|')}|`;

    // 데이터 행
    const dataRows = [];
    const startRow = hasHeader ? 1 : 0;
    for (let i = startRow; i < rows; i++) {
        const cells = Array(cols).fill(0).map((_, j) => `내용${i + 1}-${j + 1}`);
        dataRows.push(`| ${cells.join(' | ')} |`);
    }

    // 표 텍스트 구성
    let tableText = '\n';
    if (hasHeader) {
        tableText += headerRow + '\n' + separatorRow + '\n';
    }
    tableText += dataRows.join('\n') + '\n';

    const cursor = editor.getCursor();
    editor.replaceRange(tableText, cursor);
    closeTableDialog();
    editor.focus();
}

// 코드 블록 삽입
function insertCode() {
    const codeText = `
\`\`\`javascript
// 코드를 입력하세요
console.log('Hello, World!');
\`\`\`
`;
    const cursor = editor.getCursor();
    editor.replaceRange(codeText, cursor);
    editor.focus();
}

// 수식 삽입
function insertMath() {
    const mathText = `
수식 예제:
- 인라인: $E = mc^2$
- 블록: $$\\int_{a}^{b} f(x)dx = F(b) - F(a)$$
`;
    const cursor = editor.getCursor();
    editor.replaceRange(mathText, cursor);
    editor.focus();
}

// 테마 토글
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

    // CodeMirror 테마 변경
    editor.setOption('theme', isDarkMode ? 'monokai' : 'default');

    // 아이콘 변경
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (isDarkMode) {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }

    // 로컬 스토리지에 저장
    localStorage.setItem('hangeuldown-theme', isDarkMode ? 'dark' : 'light');
}

// 파일 저장
function saveToFile() {
    const content = editor.getValue();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `document_${new Date().toISOString().slice(0, 10)}.md`;

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 파일 불러오기
function loadFile() {
    document.getElementById('fileInput').click();
}

// 파일 로드 처리
function handleFileLoad(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            editor.setValue(e.target.result);
            updatePreview();
        };
        reader.readAsText(file);
    }
}

// HTML 내보내기
function exportHTML() {
    const content = editor.getValue();
    const html = marked.parse(content);

    const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>한글다운 문서</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background: #f5f5f5; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        blockquote { border-left: 4px solid #007AFF; padding-left: 1rem; margin: 1rem 0; }
    </style>
</head>
<body>
${html}
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
<script>
renderMathInElement(document.body, {
    delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
    ],
    throwOnError: false
});
</script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}