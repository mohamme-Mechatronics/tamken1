import { parse } from 'acorn';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

// Only literal messages are exported; credentials, URLs and workflow configuration stay out of the app.
const source = process.argv[2];
if (!source) throw new Error('Pass the n8n workflow JSON path');
const workflow = JSON.parse(readFileSync(source, 'utf8'));
const code = workflow.nodes.find((n) => n.name === 'State Machine')?.parameters?.jsCode;
if (!code) throw new Error('State Machine node missing');
const destination = 'src/lib/bot-texts.json';
const previous = JSON.parse(readFileSync(destination, 'utf8'));
const tree = parse(code, { ecmaVersion: 'latest', allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true, locations: true });
const records = [];
const seen = new Set();
const ignored = /^(ITEM_CATS|RES_TABLE|CATALOG_FILES|ITEM_PRICES|ACTES_KEYMAP|ACTES_SPECS|SUNTECH_720_SPECS|SUP_KB|GOVS|GOVERNORATES)$/;
const section = (context, value) => {
  const hint = context.join(' ');
  if (/pump/i.test(hint)) return 'الغطاسات والآبار الزراعية';
  if (/pay|buy|bank/i.test(hint)) return 'الشراء والدفع';
  if (/sup|fault|support/i.test(hint)) return 'الدعم الفني';
  if (/pvs|study|pvc|pvt|pvd/i.test(hint)) return 'دراسة PVsyst';
  if (/sld/i.test(hint)) return 'مخطط SLD';
  if (/ind|factory/i.test(hint)) return 'الصناعي';
  if (/stor|cab|rack/i.test(hint)) return 'التخزين';
  if (/com/i.test(hint)) return 'التجاري';
  if (/res/i.test(hint)) return 'السكني';
  if (/WEL|goStart|goWelcome|menu|lang/i.test(hint)) return 'الترحيب والقائمة الرئيسية';
  if (/quote/i.test(hint)) return 'عرض السعر';
  if (/city|location|gov/i.test(hint)) return 'الموقع والمدينة';
  if (/item|cart/i.test(hint)) return 'طلب أصناف';
  return previous.find((r) => r.o === value)?.s ?? 'رسائل عامة';
};
function visit(node, parents = [], context = []) {
  if (!node || typeof node !== 'object' || !node.type) return;
  const name = node.type === 'VariableDeclarator' ? node.id?.name : /Function/.test(node.type) ? node.id?.name : undefined;
  if (name && ignored.test(name)) return;
  const propertyName = node.type === 'Property' ? node.key?.name ?? node.key?.value : undefined;
  const hints = [...context, ...(name ? [name] : []), ...(propertyName ? [propertyName] : [])];
  if (node.type === 'Literal' && typeof node.value === 'string') {
    const value = node.value;
    const parent = parents.at(-1);
    const isKey = parent?.type === 'Property' && parent.key === node;
    const excluded = parent?.type === 'CallExpression' && /test|replace|match|indexOf|includes|split/.test(parent.callee?.property?.name ?? '');
    if (!isKey && !excluded && /[\u0600-\u06ff]/.test(value) && value.trim().length >= 3 && !/^https?:\/\//.test(value) && !/^[٠-٩۰-۹]+$/.test(value.trim())) {
      let button;
      if (parent?.type === 'Property' && propertyName === undefined && (parent.key?.name ?? parent.key?.value) === 'title') {
        const object = parents.at(-2);
        button = object?.properties?.find((p) => (p.key?.name ?? p.key?.value) === 'id')?.value;
      }
      const id = button?.type === 'Literal' ? String(button.value) : undefined;
      const kind = id ? 'b' : 't';
      const signature = JSON.stringify([kind, id ?? '', value]);
      if (!seen.has(signature)) {
        seen.add(signature);
        const old = previous.find((r) => r.t === kind && r.o === value && (r.b ?? '') === (id ?? ''));
        const group = [...parents].reverse().find((p) => p.type === 'ObjectExpression' || p.type === 'ReturnStatement' || p.type === 'VariableDeclarator');
        const desc = kind === 'b' ? parents.at(-2)?.properties?.find((p) => (p.key?.name ?? p.key?.value) === 'description')?.value : undefined;
        records.push({ k: old?.k ?? createHash('sha256').update(signature).digest('hex').slice(0, 16), m: `v51_${group?.start ?? node.start}`, t: kind, s: section(hints, value), o: value, ...(id ? { b: id } : {}), ...(desc?.type === 'Literal' ? { d: String(desc.value) } : {}) });
      }
    }
  }
  for (const [key, child] of Object.entries(node)) {
    if (key === 'loc') continue;
    if (Array.isArray(child)) for (const item of child) visit(item, [...parents, node], hints);
    else if (child?.type) visit(child, [...parents, node], hints);
  }
}
visit(tree);
writeFileSync(destination, JSON.stringify(records, null, 2) + '\n');
console.log(`Imported ${records.length} editable fragments from ${workflow.name}; pump section: ${records.filter((r) => r.s === 'الغطاسات والآبار الزراعية').length}`);