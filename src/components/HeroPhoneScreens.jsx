import { motion } from 'framer-motion';

const SAFE_SHEET_ITEMS = [
  'Send Signal request',
  'Enable Audio recording',
  'Notify emergency contacts',
  'Dial police',
];

const WALLET_ACTIVITY = [
  { label: 'Stripe payout', amount: '+$2,400', time: '2m ago', icon: '↓' },
  { label: 'AWS infra', amount: '-$186', time: '1h ago', icon: '↑' },
  { label: 'Client retainer', amount: '+$5,000', time: 'Yesterday', icon: '↓' },
];

const ROUTE_STEPS = [
  { label: 'Student Centre', done: true },
  { label: 'Library · Level 2', done: true },
  { label: 'Engineering Block B', done: false },
];

function PhoneStatusBar({ theme = 'dark' }) {
  return (
    <div className={`phone-ui-status phone-ui-status--${theme}`} aria-hidden>
      <span>9:41</span>
      <span className="phone-ui-status__icons">
        <span className="phone-ui-status__signal" />
        <span className="phone-ui-status__wifi" />
        <span className="phone-ui-status__battery" />
      </span>
    </div>
  );
}

export function SafeAgainPhoneScreen() {
  return (
    <div className="phone-ui phone-ui--safe-again">
      <PhoneStatusBar theme="dark" />
      <div className="phone-ui-safe__map" aria-hidden>
        <div className="phone-ui-safe__streets" />
        <motion.span
          className="phone-ui-safe__pin phone-ui-safe__pin--a"
          animate={{ scale: [1, 1.12, 1], opacity: [1, 0.85, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="phone-ui-safe__pin phone-ui-safe__pin--b" />
        <p className="phone-ui-safe__area">WEST END</p>
      </div>

      <motion.div
        className="phone-ui-safe__sheet"
        initial={{ y: '100%' }}
        animate={{ y: ['100%', '0%', '0%', '100%'] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: [0.32, 0.72, 0, 1],
          times: [0, 0.22, 0.78, 1],
        }}
      >
        <div className="phone-ui-safe__sheet-handle" aria-hidden />
        <div className="phone-ui-safe__sheet-head">
          <h4>Emergency</h4>
          <button type="button" aria-hidden>
            ×
          </button>
        </div>
        <ul className="phone-ui-safe__list">
          {SAFE_SHEET_ITEMS.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: [0, 1, 1, 0], x: [-8, 0, 0, -8] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                times: [0, 0.18 + i * 0.03, 0.78, 1],
              }}
            >
              <span aria-hidden />
              {item}
            </motion.li>
          ))}
        </ul>
        <p className="phone-ui-safe__hint">💡 Sending Signal enables above features</p>
        <motion.button
          type="button"
          className="phone-ui-safe__cta"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        >
          Send Signal
        </motion.button>
      </motion.div>
    </div>
  );
}

export function VaultWalletPhoneScreen() {
  return (
    <div className="phone-ui phone-ui--vault">
      <PhoneStatusBar theme="dark" />
      <div className="phone-ui-vault__mesh" aria-hidden />

      <header className="phone-ui-vault__header">
        <span className="phone-ui-vault__avatar" aria-hidden />
        <span className="phone-ui-vault__greeting">Good evening</span>
      </header>

      <div className="phone-ui-vault__balance">
        <span className="phone-ui-vault__balance-label">Available balance</span>
        <motion.p
          className="phone-ui-vault__balance-value"
          animate={{ opacity: [0.72, 1, 0.72] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          $24,850
          <span>.00</span>
        </motion.p>
        <motion.span
          className="phone-ui-vault__balance-change"
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          +12.4% this month
        </motion.span>
      </div>

      <motion.div
        className="phone-ui-vault__card"
        animate={{
          boxShadow: [
            '0 12px 28px rgb(0 0 0 / 0.35)',
            '0 16px 36px rgb(99 102 241 / 0.28)',
            '0 12px 28px rgb(0 0 0 / 0.35)',
          ],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="phone-ui-vault__card-top">
          <span>Business</span>
          <span className="phone-ui-vault__chip" aria-hidden />
        </div>
        <p className="phone-ui-vault__card-number">•••• 4821</p>
        <div className="phone-ui-vault__card-foot">
          <span>SATYAM T.</span>
          <span>09/28</span>
        </div>
        <motion.div
          className="phone-ui-vault__card-shine"
          animate={{ x: ['-120%', '180%'] }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
          aria-hidden
        />
      </motion.div>

      <div className="phone-ui-vault__activity">
        <p className="phone-ui-vault__activity-title">Recent activity</p>
        <ul>
          {WALLET_ACTIVITY.map((row, i) => (
            <motion.li
              key={row.label}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: [0.4, 1, 1, 0.4], x: [12, 0, 0, 12] }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                delay: i * 0.15,
                times: [0, 0.15, 0.85, 1],
              }}
            >
              <span className={`phone-ui-vault__activity-icon phone-ui-vault__activity-icon--${row.icon === '↓' ? 'in' : 'out'}`}>
                {row.icon}
              </span>
              <div>
                <strong>{row.label}</strong>
                <span>{row.time}</span>
              </div>
              <em>{row.amount}</em>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function CampusRoutePhoneScreen() {
  return (
    <div className="phone-ui phone-ui--route">
      <PhoneStatusBar theme="light" />
      <header className="phone-ui-route__header">
        <button type="button" className="phone-ui-route__back" aria-hidden>
          ‹
        </button>
        <div>
          <p className="phone-ui-route__eyebrow">Indoor navigation</p>
          <h4>Engineering Block B</h4>
        </div>
      </header>

      <div className="phone-ui-route__map" aria-hidden>
        <div className="phone-ui-route__blocks">
          <span className="phone-ui-route__block phone-ui-route__block--a" />
          <span className="phone-ui-route__block phone-ui-route__block--b" />
          <span className="phone-ui-route__block phone-ui-route__block--c" />
          <span className="phone-ui-route__block phone-ui-route__block--d" />
        </div>
        <svg className="phone-ui-route__path" viewBox="0 0 200 140" preserveAspectRatio="none">
          <motion.path
            d="M 28 108 Q 62 92 88 72 T 148 38"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="200"
            animate={{ strokeDashoffset: [200, 0, 0, 200] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.4, 0.78, 1],
            }}
          />
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>
        <motion.span
          className="phone-ui-route__you"
          animate={{
            left: ['10%', '38%', '68%'],
            top: ['74%', '50%', '30%'],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.42, 0.78],
          }}
        />
        <span className="phone-ui-route__pin phone-ui-route__pin--dest" />
      </div>

      <motion.div
        className="phone-ui-route__sheet"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="phone-ui-route__eta">
          <motion.strong
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            4 min
          </motion.strong>
          <span>· 180 m · Level 1</span>
        </div>
        <ol className="phone-ui-route__steps">
          {ROUTE_STEPS.map((step, i) => (
            <motion.li
              key={step.label}
              animate={{ opacity: step.done ? [0.5, 1, 1] : [0.35, 0.55, 0.35] }}
              transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity }}
              className={step.done ? 'is-done' : ''}
            >
              <span aria-hidden />
              {step.label}
            </motion.li>
          ))}
        </ol>
      </motion.div>
    </div>
  );
}

export const HERO_PHONE_SCREENS = [
  { id: 'safe-again', label: 'Safe Again — safety app', Screen: SafeAgainPhoneScreen },
  { id: 'vault', label: 'Fintech wallet — balance & payouts', Screen: VaultWalletPhoneScreen },
  { id: 'route', label: 'Campus navigation — indoor routes', Screen: CampusRoutePhoneScreen },
];
