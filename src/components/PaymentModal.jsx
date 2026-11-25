import { useState } from 'react';
import { Modal } from './ui';
import { CardIcon, CheckIcon, LockIcon } from './Icons';
import { makePayment, naira } from '../api/services';

/**
 * Card payment form. On success the payment is recorded as verified.
 * In production the backend must confirm the payment with the gateway (e.g. Korapay/Paystack webhook)
 * before marking it verified — see makePayment() in api/services.js.
 */
export function PaymentModal({ user, purpose, amount, title, onClose, onPaid }) {
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [state, setState] = useState('form'); // form | processing | done
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);

  async function pay(e) {
    e.preventDefault();
    setError('');
    if (card.number.replace(/\s/g, '').length < 16 || !/^\d{2}\/\d{2}$/.test(card.expiry) || card.cvv.length < 3) {
      setError('Enter a valid card number, expiry (MM/YY) and CVV.');
      return;
    }
    setState('processing');
    try {
      const p = await makePayment(user.id, { purpose, amount });
      setPayment(p);
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('form');
    }
  }

  const close = () => (state === 'done' ? onPaid(payment) : onClose());

  return (
    <Modal title={state === 'done' ? 'Payment successful' : title} onClose={close}>
      {state === 'done' ? (
        <div className="pay-done">
          <span className="pay-check"><CheckIcon width={30} height={30} /></span>
          <p className="pay-amount">{naira(payment.amount)}</p>
          <p className="muted">Reference <strong>{payment.reference}</strong></p>
          <p className="muted small">Your payment has been verified and a receipt was sent to {user.email}.</p>
          <button className="btn btn-primary btn-block" onClick={close}>Continue</button>
        </div>
      ) : (
        <form onSubmit={pay} className="pay-form">
          <div className="pay-summary">
            <span className="panel-icon"><CardIcon /></span>
            <div>
              <p className="muted small">Amount to pay</p>
              <p className="pay-amount">{naira(amount)}</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="card-number">Card number</label>
            <input id="card-number" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
          </div>
          <div className="two-col">
            <div className="field">
              <label htmlFor="card-expiry">Expiry (MM/YY)</label>
              <input id="card-expiry" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="card-cvv">CVV</label>
              <input id="card-cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
            </div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={state === 'processing'}>
            {state === 'processing' ? 'Processing payment…' : <><LockIcon width={18} height={18} /> Pay {naira(amount)}</>}
          </button>
        </form>
      )}
    </Modal>
  );
}
