import { ORDER_STATUS, PAY_STATUS } from '../utils';

export const OrderBadge = ({ value }) => {
  const [text, cls] = ORDER_STATUS[value] || [value, 'b-gray'];
  return <span className={`badge ${cls}`}>{text}</span>;
};
export const PayBadge = ({ value }) => {
  const [text, cls] = PAY_STATUS[value] || [value || '—', 'b-gray'];
  return <span className={`badge ${cls}`}>{text}</span>;
};
