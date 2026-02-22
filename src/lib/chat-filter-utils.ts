import { supabaseServer } from '@/app/supabase/supabase-server';

export interface FilterResult {
  isFiltered: boolean;
  severity: number | null;
  matchedWord: string | null;
  category: string | null;
  action: 'allow' | 'warn' | 'filter' | 'block';
  message?: string;
}

/**
 * Check if a message contains any filtered words
 * @param message - The message to check
 * @returns FilterResult containing information about the filter match
 */
export async function checkChatFilters(message: string): Promise<FilterResult> {
  try {
    // Fetch all active filters
    const { data: filters, error } = await supabaseServer
      .from('chat_filters')
      .select('word, category, severity, is_active')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching chat filters:', error);
      return {
        isFiltered: false,
        severity: null,
        matchedWord: null,
        category: null,
        action: 'allow',
      };
    }

    if (!filters || filters.length === 0) {
      return {
        isFiltered: false,
        severity: null,
        matchedWord: null,
        category: null,
        action: 'allow',
      };
    }

    // Normalize message for comparison
    const normalizedMessage = message.toLowerCase();

    // Check each filter
    let highestSeverity = 0;
    let matchedFilter: { word: string; category: string; severity: number } | null = null;

    for (const filter of filters) {
      const normalizedWord = filter.word.toLowerCase();
      
      // Check if the message contains the filtered word (whole word match or substring)
      const wordRegex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      if (wordRegex.test(normalizedMessage) || normalizedMessage.includes(normalizedWord)) {
        if (filter.severity > highestSeverity) {
          highestSeverity = filter.severity;
          matchedFilter = {
            word: filter.word,
            category: filter.category,
            severity: filter.severity,
          };
        }
      }
    }

    // If no match found, allow the message
    if (!matchedFilter) {
      return {
        isFiltered: false,
        severity: null,
        matchedWord: null,
        category: null,
        action: 'allow',
      };
    }

    // Determine action based on severity
    let action: 'allow' | 'warn' | 'filter' | 'block' = 'allow';
    let actionMessage = '';

    switch (matchedFilter.severity) {
      case 1: // Low - Warning only
        action = 'warn';
        actionMessage = `Your message contains language that may violate community guidelines (${matchedFilter.category}). Please be respectful.`;
        break;
      case 2: // Medium - Filter message
        action = 'filter';
        actionMessage = `Your message contains inappropriate content (${matchedFilter.category}) and has been filtered.`;
        break;
      case 3: // High - Block message
        action = 'block';
        actionMessage = `Your message has been blocked due to inappropriate content (${matchedFilter.category}). Please review our community guidelines.`;
        break;
      default:
        action = 'allow';
    }

    return {
      isFiltered: true,
      severity: matchedFilter.severity,
      matchedWord: matchedFilter.word,
      category: matchedFilter.category,
      action,
      message: actionMessage,
    };
  } catch (error) {
    console.error('Error in checkChatFilters:', error);
    // On error, allow the message through (fail open)
    return {
      isFiltered: false,
      severity: null,
      matchedWord: null,
      category: null,
      action: 'allow',
    };
  }
}

/**
 * Filter/censor a message by replacing filtered words with asterisks
 * @param message - The original message
 * @param filters - Array of active filters
 * @returns The filtered message
 */
export async function filterMessage(message: string): Promise<string> {
  try {
    // Fetch all active filters
    const { data: filters, error } = await supabaseServer
      .from('chat_filters')
      .select('word')
      .eq('is_active', true);

    if (error || !filters || filters.length === 0) {
      return message;
    }

    let filteredMessage = message;

    // Replace each filtered word with asterisks
    for (const filter of filters) {
      const normalizedWord = filter.word.toLowerCase();
      const wordRegex = new RegExp(`\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      filteredMessage = filteredMessage.replace(wordRegex, (match) => '*'.repeat(match.length));
    }

    return filteredMessage;
  } catch (error) {
    console.error('Error in filterMessage:', error);
    return message;
  }
}
