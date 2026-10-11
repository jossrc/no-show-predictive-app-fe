import { Notice } from '@/components/shared/Notice';
import type { ReservationList } from '@/features/reservations/api/contract';

type NoticeItem = { key: string; tone: 'neutral' | 'warning'; text: string };

/**
 * Avisos del listado priorizados y sin duplicados: como máximo uno sobre estimaciones, uno sobre
 * actualización y uno sobre el origen de los datos. Solo se derivan de la respuesta del backend.
 */
export function listNotices(list: ReservationList, dataMode: string): NoticeItem[] {
  const notices: NoticeItem[] = [];
  const withoutScores =
    list.data.length > 0 && list.data.every((item) => item.risk.probabilities.length === 0);

  if (!list.predictiveStoreAvailable) {
    notices.push({
      key: 'estimates-error',
      tone: 'warning',
      text: 'Las reservas están disponibles, pero no podemos consultar sus estimaciones en este momento.',
    });
  } else if (withoutScores) {
    notices.push({
      key: 'without-estimates',
      tone: 'neutral',
      text: 'Las estimaciones no están disponibles para estas citas.',
    });
  }
  if (list.data.some((item) => item.sourceFreshness === 'STALE_CLASSIFICATION')) {
    notices.push({
      key: 'stale',
      tone: 'neutral',
      text: 'La información de algunas citas podría requerir actualización.',
    });
  }
  // En modo de prueba el banner global ya advierte que los datos son simulados.
  if (list.sourceStatus === 'SYNTHETIC_DEMO_ONLY' && dataMode !== 'mock') {
    notices.push({
      key: 'synthetic',
      tone: 'neutral',
      text: 'Estas citas provienen de datos de demostración, no de la agenda real.',
    });
  }
  return notices;
}

export function ListNotices({ list, dataMode }: { list: ReservationList; dataMode: string }) {
  const notices = listNotices(list, dataMode);
  if (notices.length === 0) return null;
  return (
    <div className="space-y-2">
      {notices.map((notice) => (
        <Notice key={notice.key} tone={notice.tone}>
          {notice.text}
        </Notice>
      ))}
    </div>
  );
}
