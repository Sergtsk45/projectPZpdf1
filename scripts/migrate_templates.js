#!/usr/bin/env node
/**
 * @file: scripts/migrate_templates.js
 * @description: Миграция PDF шаблонов в backend/storage/templates к схеме template_<templateId>.pdf
 * - Находит соответствующие файлы по SHA256 (templateId) и переименовывает их
 * - Дописывает в манифест поле storageFileName, если отсутствует
 * - Выводит сводку по итогам
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ROOT = process.cwd();
const MANIFESTS_DIR = path.join(ROOT, 'backend/storage/manifests');
const TEMPLATES_DIR = path.join(ROOT, 'backend/storage/templates');

async function sha256(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function buildHashIndex() {
  const files = await fs.readdir(TEMPLATES_DIR);
  const pdfs = files.filter(f => f.toLowerCase().endsWith('.pdf'));
  const map = new Map();
  for (const f of pdfs) {
    const full = path.join(TEMPLATES_DIR, f);
    try {
      const hash = await sha256(full);
      map.set(hash, f);
    } catch (e) {
      console.warn(`⚠️ Не удалось хешировать ${f}: ${e.message}`);
    }
  }
  return map;
}

async function migrate() {
  console.log('🔧 Запуск миграции шаблонов...');
  await fs.mkdir(MANIFESTS_DIR, { recursive: true });
  await fs.mkdir(TEMPLATES_DIR, { recursive: true });

  const hashIndex = await buildHashIndex();
  const manifestFiles = (await fs.readdir(MANIFESTS_DIR)).filter(f => f.endsWith('.json'));

  let updatedManifests = 0;
  let renamedFiles = 0;
  let warnings = 0;

  for (const mf of manifestFiles) {
    const mPath = path.join(MANIFESTS_DIR, mf);
    try {
      const raw = await fs.readFile(mPath, 'utf8');
      const manifest = JSON.parse(raw);
      const { templateId } = manifest;
      if (!templateId) {
        console.warn(`⚠️ Манифест без templateId: ${mf}`);
        warnings++;
        continue;
      }

      const expectedName = `template_${templateId}.pdf`;
      const currentName = hashIndex.get(templateId);

      if (currentName) {
        if (currentName !== expectedName) {
          await fs.rename(path.join(TEMPLATES_DIR, currentName), path.join(TEMPLATES_DIR, expectedName));
          console.log(`✳️ Переименовано: ${currentName} → ${expectedName}`);
          renamedFiles++;
        }
      } else {
        console.warn(`⚠️ Не найден файл шаблона для ${templateId} в ${TEMPLATES_DIR}`);
        warnings++;
      }

      if (manifest.storageFileName !== expectedName) {
        manifest.storageFileName = expectedName;
        await fs.writeFile(mPath, JSON.stringify(manifest, null, 2));
        updatedManifests++;
      }
    } catch (e) {
      console.warn(`⚠️ Ошибка обработки ${mf}: ${e.message}`);
      warnings++;
    }
  }

  console.log('\n✅ Миграция завершена');
  console.log(`• Обновлено манифестов: ${updatedManifests}`);
  console.log(`• Переименовано файлов: ${renamedFiles}`);
  console.log(`• Предупреждений: ${warnings}`);
}

migrate().catch(err => {
  console.error('❌ Критическая ошибка миграции:', err);
  process.exit(1);
});

