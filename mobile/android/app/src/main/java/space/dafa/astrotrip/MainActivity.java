package space.dafa.astrotrip;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /* The back button steps back through the page's own history before it
       leaves the app. The library and settings panels each add a history entry
       when they open, and close on popstate, so this is what makes Back close a
       panel. Without it Back left the app with the library open - measured on the
       emulator, 11 Oct 2026 - because Capacitor routes Back to the page only when
       its App plugin is installed, and this is the whole of what that plugin
       would have been here for. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                if (wv != null && wv.canGoBack()) {
                    wv.goBack();
                    return;
                }
                // Nothing to go back to in the page: let Android do what it does
                // on a root screen, then take Back again for the next visit.
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }
}
