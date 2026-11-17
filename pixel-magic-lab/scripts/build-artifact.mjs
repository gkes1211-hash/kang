// claude.ai 웹페이지(Artifact)용 한 장짜리 HTML 만들기
// 사용법: npm run build:artifact  →  artifact/pixel-magic-lab.html
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

execSync('npx vite build --outDir dist-artifact --emptyOutDir', { stdio: 'inherit', env: { ...process.env, VITE_ARTIFACT: '1' } });
const dir = 'dist-artifact/assets/';
const files = readdirSync(dir);
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(dir + f, 'utf8'));
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(dir + f, 'utf8'));
if (js.length !== 1) throw new Error('JS 파일이 하나여야 해요: ' + js.length);
const safeJs = js[0].replace(/<\/script/gi, '<\\/script');
const favicon = readFileSync('public/favicon.svg', 'utf8');
const html = `<title>픽셀 마법사 연구소</title>
<meta name="description" content="코딩 블록으로 픽셀 그림을 그리고 움직이는 초등 코딩 교육 웹앱">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(favicon)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&display=swap">
<style>
${css.join('\n')}
</style>
<div id="root"></div>
<script type="module">
${safeJs}
</script>
`;
mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/pixel-magic-lab.html', html);
console.log('artifact/pixel-magic-lab.html', (html.length / 1024).toFixed(0) + 'KB');
