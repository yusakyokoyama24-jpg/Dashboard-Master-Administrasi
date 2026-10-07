import Swal from 'sweetalert2';

export const ToastSwal = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
  customClass: {
    popup: 'colored-toast rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showToast = (
  title: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'success',
  text?: string
) => {
  ToastSwal.fire({
    icon: type,
    title: title,
    text: text,
  });
};
