const STEPS = ['Giỏ hàng', 'Đặt hàng', 'Thanh toán'];

export default function Stepper({ current }) {
  return (
    <div className="steps">
      {STEPS.map((s, i) => (
        <div key={s} className="step-wrap">
          <div className={`step ${i + 1 <= current ? 'on' : ''}`}><span className="n">{i + 1}</span>{s}</div>
          {i < STEPS.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}
