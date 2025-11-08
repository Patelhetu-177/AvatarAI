import { Document } from '@langchain/core/documents';

interface FormattedDocumentSection {
  type: 'text' | 'list' | 'code' | 'table' | 'diagram' | 'keyValue' | 'section';
  content: string | string[] | Record<string, string | string[]>;
  title?: string;
  metadata?: Record<string, string | number | boolean | null | undefined | string[]>;
}

export interface FormattedDocument {
  id: string;
  title: string;
  summary: string;
  sections: FormattedDocumentSection[];
  metadata: Record<string, string | number | boolean | null | undefined | string[]>;
}

const parseKeyValue = (content: string): Record<string, string | string[]> => {
  const result: Record<string, string | string[]> = {};
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  let currentKey = '';
  let currentValues: string[] = [];

  for (const line of lines) {
    if (line.match(/^[A-Za-z][A-Za-z\s]*:/)) {
      if (currentKey) {
        result[currentKey] = currentValues.length === 1 ? currentValues[0] : [...currentValues];
      }
      currentKey = line.replace(':', '').trim();
      currentValues = [];
    } else if (line.trim().startsWith('- ')) {
      currentValues.push(line.replace(/^-\s*/, '').trim());
    } else if (line.trim() !== '') {
      if (currentValues.length > 0) {
        currentValues[currentValues.length - 1] += ' ' + line.trim();
      } else {
        currentValues.push(line.trim());
      }
    }
  }

  if (currentKey) {
    result[currentKey] = currentValues.length === 1 ? currentValues[0] : [...currentValues];
  }

  return result;
};

export const formatDocumentContent = (
  document: Document,
  content: string
): FormattedDocument => {
  const sections: FormattedDocumentSection[] = [];
  const paragraphs = content.split(/\n{2,}/).filter(p => p.trim() !== '');
  let currentSection: FormattedDocumentSection | null = null;

  for (const para of paragraphs) {
    if (para.startsWith('**') && para.endsWith('**')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        type: 'section',
        title: para.replace(/\*\*/g, '').trim(),
        content: ''
      };
      continue;
    }

    if (para.includes(':')) {
      const [header, ...contentLines] = para.split('\n');
      const sectionContent = contentLines.join('\n').trim();
      const title = header.replace(':', '').trim();

      if (sectionContent.includes('- ')) {
        const listItems = sectionContent
          .split('\n')
          .map(item => item.replace(/^-\s*/, '').trim())
          .filter(item => item);

        if (currentSection) {
          currentSection.content = [
            ...(Array.isArray(currentSection.content) ? currentSection.content : []),
            ...listItems
          ];
        } else {
          sections.push({
            type: 'list',
            title,
            content: listItems
          });
        }
        continue;
      }

      if (sectionContent.includes('* ')) {
        const keyValuePairs = parseKeyValue(para);
        sections.push({
          type: 'keyValue',
          title,
          content: keyValuePairs
        });
        continue;
      }

      if (sectionContent.includes('|') && sectionContent.includes('-|')) {
        sections.push({
          type: 'table',
          title,
          content: sectionContent
        });
        continue;
      }

      if (currentSection) {
        currentSection.content += `\n\n${title}:\n${sectionContent}`;
      } else {
        sections.push({
          type: 'text',
          title,
          content: sectionContent
        });
      }
      continue;
    }

    if (para.startsWith('```')) {
      const [lang, ...codeLines] = para.split('\n').slice(1, -1);
      sections.push({
        type: 'code',
        content: codeLines.join('\n').trim(),
        title: lang?.trim() || 'code'
      });
      continue;
    }

    if (currentSection) {
      currentSection.content += `\n\n${para}`;
    } else {
      sections.push({
        type: 'text',
        content: para
      });
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  const id = document.metadata?.source || 
    content.split('\n')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const title = document.metadata?.title || 
    content.split('\n')[0].replace(/^#+\s*/, '').trim();

  const summary = document.metadata?.summary || 
    content.split('\n').slice(0, 3).join(' ').substring(0, 150) + '...';

  return {
    id,
    title,
    summary,
    sections,
    metadata: {
      ...document.metadata,
      processedAt: new Date().toISOString(),
      source: document.metadata?.source || 'unknown',
      type: document.metadata?.type || 'document'
    }
  };
};

export const formattedDocumentToText = (doc: FormattedDocument): string => {
  let result = `# ${doc.title}\n\n${doc.summary}\n\n`;

  for (const section of doc.sections) {
    if (section.title) {
      result += `## ${section.title}\n\n`;
    }

    if (Array.isArray(section.content)) {
      result += section.content.map(item => `- ${item}`).join('\n');
    } else if (typeof section.content === 'object') {
      if (section.type === 'keyValue') {
        for (const [key, value] of Object.entries(section.content)) {
          result += `**${key}**:\n`;
          if (Array.isArray(value)) {
            result += value.map(v => `- ${v}`).join('\n');
          } else {
            result += value;
          }
          result += '\n\n';
        }
      } else {
        result += JSON.stringify(section.content, null, 2);
      }
    } else {
      result += section.content;
    }

    result += '\n\n';
  }

  return result.trim();
};
